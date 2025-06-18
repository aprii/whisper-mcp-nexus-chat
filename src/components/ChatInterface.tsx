import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  LogOut, 
  Bot, 
  User, 
  Settings, 
  Wifi, 
  WifiOff,
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface MCPConnection {
  isConnected: boolean;
  serverUrl: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const ChatInterface = () => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mcpConnection, setMcpConnection] = useState<MCPConnection>({
    isConnected: false,
    serverUrl: '',
    status: 'disconnected'
  });
  const [serverUrl, setServerUrl] = useState('http://localhost:3001/sse');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectToMCP = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setMcpConnection(prev => ({ ...prev, status: 'connecting' }));

    try {
      const eventSource = new EventSource(serverUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('Connected to MCP server');
        setMcpConnection({
          isConnected: true,
          serverUrl,
          status: 'connected'
        });
      };

      eventSource.onmessage = (event) => {
        console.log('Received message:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message') {
            const botMessage: Message = {
              id: Date.now().toString(),
              content: data.content,
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      eventSource.onerror = () => {
        console.error('SSE connection error');
        setMcpConnection({
          isConnected: false,
          serverUrl,
          status: 'error'
        });
        setIsTyping(false);
      };
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      setMcpConnection({
        isConnected: false,
        serverUrl,
        status: 'error'
      });
    }
  };

  const disconnectFromMCP = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setMcpConnection({
      isConnected: false,
      serverUrl: '',
      status: 'disconnected'
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // If not connected to MCP, simulate a response
    if (!mcpConnection.isConnected) {
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'm not connected to an MCP server right now. Please connect to a server to start chatting!",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    // Send message to MCP server (this would be a POST request in a real implementation)
    try {
      const response = await fetch(serverUrl.replace('/sse', '/message'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          userId: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I couldn't send your message. Please check your connection.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Get user display name from either metadata or email
  const getUserDisplayName = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-white">MCP Chat</h1>
              <div className="flex items-center space-x-2 text-sm">
                {mcpConnection.isConnected ? (
                  <Wifi className="h-4 w-4 text-green-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <span className="text-slate-300">
                  {mcpConnection.status === 'connected' ? 'Connected' : 
                   mcpConnection.status === 'connecting' ? 'Connecting...' :
                   mcpConnection.status === 'error' ? 'Connection Error' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="MCP Server URL"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 w-64"
              />
              {mcpConnection.isConnected ? (
                <Button
                  onClick={disconnectFromMCP}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={connectToMCP}
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                  disabled={mcpConnection.status === 'connecting'}
                >
                  {mcpConnection.status === 'connecting' ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white">
                  {getUserInitial()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium">{getUserDisplayName()}</span>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-white mb-2">Welcome to MCP Chat</h2>
                <p className="text-slate-300">Connect to your MCP server and start chatting!</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/80 text-white border border-slate-700'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender === 'bot' && (
                      <Bot className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    )}
                    {message.sender === 'user' && (
                      <User className="h-5 w-5 text-blue-100 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-slate-800/80 text-white border border-slate-700">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-blue-400" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-t border-slate-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 pr-12"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="absolute right-1 top-1 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
