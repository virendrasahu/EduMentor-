"use client";
import { useState, useRef, useEffect, FormEvent } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { answerAcademicQuestion, AnswerAcademicQuestionOutput } from '@/ai/flows/answer-academic-question';
import { ChatMessage, Message } from '@/components/chat/ChatMessage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Bot, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/firebase/auth';

const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-4"
    >
      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary flex items-center justify-center">
        <Bot size={20} className="text-primary-foreground" />
      </div>
      <div className="max-w-xl rounded-lg p-4 bg-card border">
        <div className="flex items-center space-x-2">
            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:0s]"></span>
            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:0.2s]"></span>
            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:0.4s]"></span>
        </div>
      </div>
    </motion.div>
);

const WelcomeMessage = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <BrainCircuit size={64} className="text-primary mb-4" />
        <h1 className="text-3xl font-bold font-headline">Welcome to EduMentor Lite</h1>
        <p className="text-muted-foreground mt-2 max-w-md">Ask me anything about coding, math, science, or any other subject!</p>
    </div>
);

export function ChatInterface() {
  const { user } = useAuth();
  const chatHistoryKey = user ? `chat-history-${user.uid}` : 'chat-history';
  const [messages, setMessages] = useLocalStorage<Message[]>(chatHistoryKey, []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result: AnswerAcademicQuestionOutput = await answerAcademicQuestion({ question: currentInput });
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: result.answer,
        visualAids: result.visualAids,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "There was a problem with the AI response. Please try again.",
      });
      // Restore user input on error and remove the optimistic message
      setMessages(prev => prev.filter(m => m !== userMessage));
      setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
      <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
              {isClient && messages.length > 0 ? (
                  messages.map((msg, index) => (
                      <ChatMessage key={index} message={msg} />
                  ))
              ) : isClient ? (
                  <WelcomeMessage />
              ) : null}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
          </div>
      </div>
      <div className="p-4 md:p-6 bg-background/95 border-t">
        <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your doubt..."
                className="flex-1 h-12 text-base"
                disabled={isLoading}
                aria-label="Chat input"
              />
              <Button type="submit" size="lg" disabled={isLoading || !input.trim()} aria-label="Send message">
                <Send size={20} />
              </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
