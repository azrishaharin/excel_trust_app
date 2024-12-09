'use client';

import { useState } from 'react';
import { useAIAssistant } from '@/context/AIAssistantContext';
import ChatInterface from './ChatInterface';
import { api } from '@/utils/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const { messages, addMessage, pageContext } = useAIAssistant();

  const handleSendMessage = async (message: string) => {
    try {
      setIsLoading(true);
      addMessage(message);

      const response = await api.queryAI(message, pageContext);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

    } catch (error: any) {
      console.error('Error:', error);
      addMessage("An error occurred while processing your request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatInterface
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
    />
  );
}
