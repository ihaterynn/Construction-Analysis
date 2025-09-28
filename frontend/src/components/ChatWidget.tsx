'use client';

import { useState } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatWidgetProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function ChatWidget({ isOpen = false, onToggle }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Chat Widget</h3>
        <p className="text-gray-600">Floating chatbot widget for Q&A</p>
        {/* TODO: Implement chat interface with message history */}
      </div>
    </div>
  );
}