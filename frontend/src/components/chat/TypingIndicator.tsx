'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-accent text-accent-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="bg-accent text-accent-foreground rounded-2xl px-4 py-3 shadow-subtle">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
