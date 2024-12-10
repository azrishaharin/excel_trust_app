'use client';

import { useState } from 'react';
import { useAIAssistant } from '@/context/AIAssistantContext';
import ChatInterface from './ChatInterface';
import { api } from '@/utils/api';

export default function AIAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const { messages, addMessage, pageContext } = useAIAssistant();

  // Check if there's data in the context
  const hasData = pageContext?.data?.totalClients > 0;

  const handleSendMessage = async (message: string) => {
    try {
      setIsLoading(true);
      addMessage({ role: 'user', content: message });

      const response = await api.queryAI(message, pageContext);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      if (data.response) {
        addMessage({ role: 'assistant', content: data.response });
      }

    } catch (error: any) {
      console.error('Error:', error);
      addMessage({ role: 'assistant', content: "An error occurred while processing your request." });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render the chat interface if there's no data
  if (!hasData) {
    return null;
  }

  return (
    <ChatInterface
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
    />
  );
}
