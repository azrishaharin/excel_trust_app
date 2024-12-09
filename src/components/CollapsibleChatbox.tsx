'use client';

import { useState, ReactNode } from 'react';
import { FaChevronDown, FaChevronUp, FaRobot } from 'react-icons/fa';

interface CollapsibleChatboxProps {
  children: ReactNode;
  className?: string;
}

export default function CollapsibleChatbox({ children, className = '' }: CollapsibleChatboxProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {isExpanded ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-96">
          <div 
            className="flex items-center justify-between p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-t-lg cursor-pointer"
            onClick={() => setIsExpanded(false)}
          >
            <div className="flex items-center gap-2">
              <FaRobot className="text-lg" />
              <span className="font-medium">AI Assistant</span>
            </div>
            <FaChevronDown className="text-lg" />
          </div>
          <div className="h-[500px] overflow-y-auto">
            {children}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
        >
          <FaRobot className="text-lg" />
          <span className="font-medium">AI Assistant</span>
          <FaChevronUp className="text-lg" />
        </button>
      )}
    </div>
  );
}
