
export interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export interface ConversationContext {
  key: string;
  value: string;
}
