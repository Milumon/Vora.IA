'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface ValidationQuestionsProps {
  questions: string[];
  onQuestionClick?: (question: string) => void;
}

export function ValidationQuestions({ questions, onQuestionClick }: ValidationQuestionsProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        Respuestas sugeridas:
      </p>
      
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-left h-auto py-2 px-3 hover:bg-primary/10 hover:border-primary/50"
            onClick={() => onQuestionClick?.(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
