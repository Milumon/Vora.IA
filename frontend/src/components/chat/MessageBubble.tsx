'use client';

import { cn } from '@/lib/utils/cn';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';
import { User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AdditionalInfoWidget } from './widgets/AdditionalInfoWidget';
import { ProgressIndicator, type ProgressStep } from './widgets/ProgressIndicator';
import { type DateRange } from 'react-day-picker';

interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
    metadata?: {
      needsClarification?: boolean;
      clarificationQuestions?: string[];
      progressSteps?: ProgressStep[];
      missingDates?: boolean;
      missingBudget?: boolean;
    };
  };
  onWidgetSubmit?: (data: { dateRange?: DateRange; budgetTotal?: number; currency?: string }) => void;
}

export function MessageBubble({ message, onWidgetSubmit }: MessageBubbleProps) {
  const { user } = useAuth();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  const showWidgets = !isUser && (message.metadata?.missingDates || message.metadata?.missingBudget);
  const showProgress = !isUser && message.metadata?.progressSteps && message.metadata.progressSteps.length > 0;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3 mb-6',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-white dark:bg-black flex items-center justify-center">
        {isUser ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-orange-600 dark:bg-orange-500 text-white text-sm">
              {user ? (userName ? userName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Image
            src="/images/Vora.webp"
            alt="Vora"
            width={32}
            height={32}
            className="h-8 w-8 object-cover"
          />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col gap-3 max-w-[85%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 break-words overflow-wrap-anywhere',
            isUser
              ? 'bg-orange-600 dark:bg-orange-500 text-white'
              : 'bg-white dark:bg-black text-gray-900 dark:text-gray-100 '
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-p:break-words prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-li:text-gray-900 dark:prose-li:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {showProgress && (
          <div className="w-full">
            <ProgressIndicator steps={message.metadata!.progressSteps!} />
          </div>
        )}

        {/* Additional Info Widget */}
        {showWidgets && onWidgetSubmit && (
          <div className="w-full">
            <AdditionalInfoWidget
              onSubmit={onWidgetSubmit}
              showDatePicker={message.metadata?.missingDates}
              showBudgetSlider={message.metadata?.missingBudget}
            />
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <span className="text-xs text-gray-500 px-2">
            {new Date(message.timestamp).toLocaleTimeString('es-PE', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  );
}
