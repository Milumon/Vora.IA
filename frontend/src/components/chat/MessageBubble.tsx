'use client';

import { cn } from '@/lib/utils/cn';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';
import { User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';

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
      <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {isUser ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-gray-900 text-white text-sm">
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
          'flex flex-col gap-1 max-w-[85%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 break-words overflow-wrap-anywhere',
            isUser
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-900'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-p:break-words prose-headings:text-gray-900 prose-p:text-gray-900 prose-li:text-gray-900">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

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
