export interface Model {
  id: string;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
  type: string;
  systemPrompt: string;
  model: string;
  enabled: boolean;
  botUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelPayload {
  name: string;
  botToken: string;
  systemPrompt: string;
  model: string;
}

export interface UpdateChannelPayload {
  name?: string;
  systemPrompt?: string;
  model?: string;
  enabled?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  model: string;
  channel: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  channel: string;
  channelId?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithCount extends Omit<Conversation, "messages"> {
  messageCount: number;
}

export interface SDKMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: MessagePart[];
}

export interface MessagePart {
  type: "text";
  text: string;
}
