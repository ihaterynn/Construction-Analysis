"use client";

import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { queryVLM } from "@/lib/api";
import { 
  PaperAirplaneIcon,
  UserIcon,
  CpuChipIcon,
  PhotoIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ClipboardDocumentListIcon,
  PaperClipIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: {
    type: 'image' | 'document';
    name: string;
    url: string;
    file?: File;
  }[];
}

const initialMessages: Message[] = [
  {
    id: '1',
    type: 'assistant',
    content: 'Hello! I\'m your AI assistant for construction site analysis. I can help you with:\n\n• Interpreting detection results\n• Safety recommendations\n• Construction best practices\n• Equipment identification\n• Hazard assessment\n• Visual question answering about images\n\nHow can I assist you today?',
    timestamp: new Date()
  }
];

const quickActions = [
  {
    icon: PhotoIcon,
    title: "Analyze Image",
    description: "Upload an image for AI analysis",
    action: "analyze"
  },
  {
    icon: ExclamationTriangleIcon,
    title: "Safety Check",
    description: "Get safety recommendations",
    action: "safety"
  },
  {
    icon: LightBulbIcon,
    title: "Best Practices",
    description: "Learn construction best practices",
    action: "practices"
  },
  {
    icon: ClipboardDocumentListIcon,
    title: "Generate Report",
    description: "Create analysis report",
    action: "report"
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !attachedFile) return;

    const attachments = attachedFile ? [{
      type: 'image' as const,
      name: attachedFile.name,
      url: URL.createObjectURL(attachedFile),
      file: attachedFile
    }] : undefined;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue || "Please analyze this image",
      timestamp: new Date(),
      attachments
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    const currentFile = attachedFile;
    setInputValue("");
    setAttachedFile(null);
    setIsTyping(true);

    try {
      let response = "";
      
      if (currentFile && currentInput) {
        // Use VLM for image analysis with instruction
        const vlmResponse = await queryVLM(currentFile, currentInput);
        response = vlmResponse.data.answer;
      } else if (currentFile) {
        // Use VLM for general image analysis
        const vlmResponse = await queryVLM(currentFile, "Describe what you see in this construction site image. Identify any safety equipment, hazards, workers, and equipment present.");
        response = vlmResponse.data.answer;
      } else {
        // Generate text-only response
        response = generateAIResponse(currentInput);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('safety') || input.includes('hazard')) {
      return "Safety is paramount in construction sites. Here are key safety considerations:\n\n• Always wear proper PPE (hard hats, safety vests, steel-toed boots)\n• Ensure proper scaffolding and fall protection\n• Maintain clear emergency exits and fire extinguisher access\n• Regular safety inspections and hazard assessments\n• Proper equipment maintenance and operation\n\nWould you like me to analyze a specific image for safety compliance?";
    }
    
    if (input.includes('equipment') || input.includes('machinery')) {
      return "I can help identify various construction equipment and machinery:\n\n• Excavators and bulldozers\n• Cranes and lifting equipment\n• Scaffolding systems\n• Safety equipment (helmets, vests, barriers)\n• Tools and hand equipment\n\nOur YOLO model is trained to detect these items with high accuracy. Upload an image and I'll provide detailed analysis!";
    }
    
    if (input.includes('report') || input.includes('analysis')) {
      return "I can help generate comprehensive analysis reports including:\n\n• Object detection summary\n• Safety compliance assessment\n• Equipment inventory\n• Hazard identification\n• Recommendations for improvement\n• Confidence scores and statistics\n\nWould you like me to create a report based on your recent analyses?";
    }
    
    return "I understand you're asking about construction site analysis. I can help with object detection, safety assessments, equipment identification, and generating detailed reports. You can also upload images for visual analysis. Could you provide more specific details about what you'd like to know?";
  };

  const handleQuickAction = (action: string) => {
    let message = "";
    switch (action) {
      case "analyze":
        message = "I'd like to analyze a construction site image";
        break;
      case "safety":
        message = "Can you help me with safety recommendations?";
        break;
      case "practices":
        message = "What are the best practices for construction site management?";
        break;
      case "report":
        message = "Can you help me generate an analysis report?";
        break;
    }
    setInputValue(message);
    inputRef.current?.focus();
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setAttachedFile(file);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Assistant
          </h1>
          <p className="text-gray-600">
            Get intelligent insights and assistance for your construction site analysis.
          </p>
        </div>

        <div className="axium-card flex flex-col h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {message.type === 'user' ? (
                        <UserIcon className="w-5 h-5" />
                      ) : (
                        <CpuChipIcon className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <div className={`px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {/* Attachments */}
                    {message.attachments && (
                      <div className="mb-2">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="mb-2">
                            {attachment.type === 'image' && (
                              <img 
                                src={attachment.url} 
                                alt={attachment.name}
                                className="max-w-48 max-h-32 rounded object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex mr-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                    <CpuChipIcon className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.action)}
                    className="flex items-center space-x-2 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <action.icon className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{action.title}</p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-gray-200">
            {/* File Attachment Preview */}
            {attachedFile && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PhotoIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-900">{attachedFile.name}</span>
                </div>
                <button
                  onClick={removeAttachment}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex space-x-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                onClick={handleFileAttach}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isTyping}
              >
                <PaperClipIcon className="w-5 h-5 text-gray-500" />
              </button>
              
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about construction site analysis, safety, or upload an image..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={(!inputValue.trim() && !attachedFile) || isTyping}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  (inputValue.trim() || attachedFile) && !isTyping
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line. Attach images for visual analysis.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="axium-card p-6 text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Image Analysis</h3>
            <p className="text-gray-600 text-sm">
              Upload images for instant AI-powered object detection and visual question answering.
            </p>
          </div>
          
          <div className="axium-card p-6 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-orange-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Safety Assessment</h3>
            <p className="text-gray-600 text-sm">
              Get comprehensive safety recommendations and hazard identification.
            </p>
          </div>
          
          <div className="axium-card p-6 text-center">
            <DocumentIcon className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Reports</h3>
            <p className="text-gray-600 text-sm">
              Generate detailed analysis reports with insights and recommendations.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
