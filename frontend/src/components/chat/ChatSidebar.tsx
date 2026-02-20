'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/components/providers/AuthProvider';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Sparkles, Send } from 'lucide-react';

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
  const [input, setInput] = useState('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
            {/* Welcome Message */}
            <div className="text-center mb-12 space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 mb-6">
                <Sparkles className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {userName ? `Hola, ${userName}` : 'Bienvenido a Vora'}
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                Cuéntame sobre tu próximo viaje y crearé un itinerario personalizado para ti
              </p>
            </div>

            {/* Suggested Prompts - Estilo similar a la imagen */}
            {showSuggestions && (
              <div className="w-full space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Prueba con estas ideas:</p>
                <div className="grid gap-3">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left px-4 py-4 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                      onClick={() => handleSuggestionClick(prompt)}
                    >
                      <span className="block">{prompt}</span>
                    </button>
                  ))}
                </div>
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

      {/* Input Area - Estilo minimalista similar a la imagen */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-3 focus-within:border-gray-400 dark:focus-within:border-gray-600 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta cualquier cosa..."
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none max-h-40 overflow-y-auto"
              style={{
                minHeight: '24px',
                maxHeight: '128px',
              }}
            />

            {/* Botones de acción comentados - Archivo y Calendario */}
            {/* 
            <button
              type="button"
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Adjuntar archivo"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Seleccionar fecha"
            >
              <Calendar className="w-5 h-5" />
            </button>
            */}

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 p-2 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Enviar mensaje"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
