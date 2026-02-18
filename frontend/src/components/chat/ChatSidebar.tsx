'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/components/providers/AuthProvider';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { Send, Sparkles } from 'lucide-react';
import Image from 'next/image';

const SUGGESTED_PROMPTS = [
  'Quiero ir a Cusco 5 días con presupuesto medio',
  'Planifica un viaje romántico a Arequipa',
  'Destinos de aventura en Perú para 1 semana',
  'Viaje familiar a playas del norte peruano',
];

export function ChatSidebar() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
  } = useChat();
  const [showSuggestions, setShowSuggestions] = useState(messages.length === 0);
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setShowSuggestions(messages.length === 0);
  }, [messages.length]);

  const handleSuggestionClick = (prompt: string) => {
    setShowSuggestions(false);
    sendMessage(prompt);
  };

  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            {/* Welcome Message */}
            <div className="text-center mb-8 space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Sparkles className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {userName ? `Hola, ${userName}` : 'Bienvenido'}
              </h3>
              <p className="text-sm text-gray-600 max-w-xs mx-auto">
                Cuéntame sobre tu próximo viaje y crearé un itinerario personalizado para ti
              </p>
            </div>

            {/* Suggested Prompts */}
            {showSuggestions && (
              <div className="w-full space-y-2">
                <p className="text-xs text-gray-500 mb-3">Sugerencias:</p>
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left p-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    onClick={() => handleSuggestionClick(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
              <div key={idx}>
                <MessageBubble message={message} />
              </div>
            ))}
            
            {isLoading && <TypingIndicator />}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder="Escribe tu mensaje..."
        />
      </div>
    </div>
  );
}
