'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { generateAIResponse } from '@/utils/openai';

export interface Message {
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
  addMessage: (message: Message) => void;
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

  const addMessage = useCallback((message: Message) => {
    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
  }, [messages]);

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
