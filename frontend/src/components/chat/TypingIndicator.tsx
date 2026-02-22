'use client';

/**
 * TypingIndicator — "Vora está escribiendo…" with animated dots
 * and an optional 0-100% progress counter.
 */

import Image from 'next/image';
import { Message, MessageContent } from '@/components/ai-elements/message';

interface TypingIndicatorProps {
  /** 0-100 or null (null = no percentage shown) */
  percent?: number | null;
}

export function TypingIndicator({ percent }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-white dark:bg-black flex items-center justify-center">
        <Image
          src="/images/Vora.webp"
          alt="Vora"
          width={32}
          height={32}
          className="h-8 w-8 object-cover"
        />
      </div>

      {/* Bubble */}
      <Message from="assistant">
        <MessageContent>
          <div className="flex items-center gap-2.5">
            {/* Label + animated dots */}
            <span className="text-sm text-muted-foreground select-none whitespace-nowrap">
              Vora está escribiendo
              <span className="inline-flex ml-0.5">
                <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s] ml-0.5" />
                <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce ml-0.5" />
              </span>
            </span>

            {/* Percentage counter */}
            {percent != null && (
              <span className="ml-1 min-w-[3ch] text-right tabular-nums text-xs font-semibold text-orange-600 dark:text-orange-400">
                {percent}%
              </span>
            )}
          </div>
        </MessageContent>
      </Message>
    </div>
  );
}
