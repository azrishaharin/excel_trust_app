'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { generateAIResponse } from '@/utils/openai';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface PageContext {
  pageName: string;
  data: any;
}

interface AIAssistantContextType {
  pageContext: PageContext;
  messages: Message[];
  updatePageContext: (context: PageContext) => void;
  addMessage: (message: string) => void;
  clearMessages: () => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const defaultPageContext: PageContext = {
  pageName: '',
  data: null,
};

const loadSavedMessages = (): Message[] => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('chatMessages');
  return saved ? JSON.parse(saved) : [];
};

const AIAssistantContext = createContext<AIAssistantContextType>({
  pageContext: defaultPageContext,
  messages: [],
  updatePageContext: () => {},
  addMessage: () => {},
  clearMessages: () => {},
  isLoading: false,
  setIsLoading: () => {},
});

export function AIAssistantProvider({ children }: { children: React.ReactNode }) {
  const [pageContext, setPageContext] = useState<PageContext>(defaultPageContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved messages on mount
  useEffect(() => {
    const savedMessages = loadSavedMessages();
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    }
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const updatePageContext = useCallback((newContext: PageContext) => {
    // Get clients data from localStorage
    let clientsData = null;
    if (typeof window !== 'undefined') {
      const savedClients = localStorage.getItem('clients');
      if (savedClients) {
        clientsData = JSON.parse(savedClients);
      }
    }

    // Merge the new context with clients data
    setPageContext({
      ...newContext,
      data: {
        ...newContext.data,
        clients: clientsData
      }
    });
  }, []);

  const addMessage = useCallback(async (message: string) => {
    const newUserMessage = { role: 'user', content: message };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    
    // Get current page context
    const currentPage = pageContext.pageName;
    const pageData = pageContext.data;

    // Generate AI response
    setIsLoading(true);
    try {
      const aiResponse = await generateAIResponse(message, pageContext, messages);
      const newAIMessage = { role: 'assistant', content: aiResponse };
      const finalMessages = [...updatedMessages, newAIMessage];
      setMessages(finalMessages);
      localStorage.setItem('chatMessages', JSON.stringify(finalMessages));
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, pageContext]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
  }, []);

  const contextValue = {
    pageContext,
    messages,
    updatePageContext,
    addMessage,
    clearMessages,
    isLoading,
    setIsLoading,
  };

  return (
    <AIAssistantContext.Provider value={contextValue}>
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
}
