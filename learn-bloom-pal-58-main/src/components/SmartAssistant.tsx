import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, MessageSquare, ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  feedback?: 'up' | 'down' | null;
  links?: { title: string; url: string }[];
}

export default function SmartAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '你好！我是你的AI助教，学习上遇到任何问题，随时问我。',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // 模拟AI回复
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `关于"${inputValue}"，我来为您解答：这是一个很好的问题。根据课程内容和相关文档，我建议您可以从以下几个方面来理解这个概念...`,
        sender: 'assistant',
        timestamp: new Date(),
        links: [
          { title: "相关课程：Python基础第3章", url: "/course-learning/1?chapter=3" },
          { title: "官方文档链接", url: "#" }
        ]
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleFeedback = (messageId: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
  };

  const handleTransferToForum = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      // 转发到问答论坛的逻辑
      window.open('/forum?transfer=true&question=' + encodeURIComponent(message.text), '_blank');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Badge variant="secondary" className="ml-auto">
            24/7 在线
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 mb-4 ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {message.sender === 'assistant' ? (
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div
                  className={`flex-1 ${
                    message.sender === 'user' ? 'text-right' : ''
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg max-w-[80%] ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    
                    {/* 知识点链接 */}
                    {message.sender === 'assistant' && message.links && (
                      <div className="mt-2 space-y-1">
                        {message.links.map((link, index) => (
                          <Button
                            key={index}
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-blue-400 hover:text-blue-300"
                            onClick={() => window.open(link.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {link.title}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* AI回答的反馈按钮 */}
                  {message.sender === 'assistant' && (
                    <div className="flex items-center gap-1 mt-2">
                      <Button
                        size="sm"
                        variant={message.feedback === 'up' ? 'default' : 'ghost'}
                        onClick={() => handleFeedback(message.id, 'up')}
                        className="h-6 w-6 p-0"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={message.feedback === 'down' ? 'destructive' : 'ghost'}
                        onClick={() => handleFeedback(message.id, 'down')}
                        className="h-6 w-6 p-0"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="输入您的问题..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}