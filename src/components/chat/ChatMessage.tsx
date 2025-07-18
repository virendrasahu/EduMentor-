"use client";
import { Bot, User, Clipboard, Check } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '../ui/button';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  visualAids?: string;
}

const CodeBlock = ({ code, language }: { code: string, language: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-lg bg-secondary/50 font-code">
      <div className="flex items-center justify-between px-4 py-1.5 border-b bg-secondary/30 rounded-t-lg">
        <span className="text-sm text-muted-foreground">{language || 'code'}</span>
        <Button variant="ghost" size="icon" onClick={handleCopy} className="h-7 w-7 text-muted-foreground hover:text-foreground">
          {copied ? <Check size={16} /> : <Clipboard size={16} />}
        </Button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const renderContent = (content: string) => {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    const codeBlockMatch = part.match(/```(\w*)\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      const language = codeBlockMatch[1];
      const code = codeBlockMatch[2].trim();
      return <CodeBlock key={index} language={language} code={code} />;
    }
    // Only render non-empty text parts
    const textPart = part.trim();
    if (textPart) {
        return <p key={index} className="whitespace-pre-wrap leading-relaxed">{textPart}</p>;
    }
    return null;
  });
};

export function ChatMessage({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex items-start gap-3 md:gap-4', isAssistant ? '' : 'justify-end')}
    >
      {isAssistant && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot size={20} />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn('max-w-2xl rounded-lg px-4 py-3', isAssistant ? 'bg-card border' : 'bg-primary text-primary-foreground')}>
        <div className="prose prose-sm max-w-none text-current">
          {renderContent(message.content)}
          {message.visualAids && (
            <div className="mt-4" data-ai-hint="diagram chart">
              <Image src={message.visualAids} alt="Visual Aid" width={400} height={300} className="rounded-lg border bg-white" />
            </div>
          )}
        </div>
      </div>
      {!isAssistant && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback>
            <User size={20} />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}
