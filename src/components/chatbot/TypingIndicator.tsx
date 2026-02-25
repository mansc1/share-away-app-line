
import React from 'react';
import { Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const TypingIndicator = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <Card className="bg-gray-50">
          <CardContent className="p-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TypingIndicator;
