import type {
  Channel,
  Conversation,
  ConversationWithCount,
  CreateChannelPayload,
  Model,
  UpdateChannelPayload,
} from "@/types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Models
export const fetchModels = async (): Promise<Model[]> => {
  const res = await fetch("/api/models");
  return json<Model[]>(res);
};

// Conversations
export const fetchConversations = async (): Promise<ConversationWithCount[]> => {
  const res = await fetch("/api/conversations");
  return json<ConversationWithCount[]>(res);
};

export const fetchConversation = async (id: string): Promise<Conversation> => {
  const res = await fetch(`/api/conversations/${id}`);
  return json<Conversation>(res);
};

export const createConversation = async (model: string): Promise<Conversation> => {
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  return json<Conversation>(res);
};

export const deleteConversation = async (id: string): Promise<void> => {
  const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

// Channels
export const fetchChannels = async (): Promise<Channel[]> => {
  const res = await fetch("/api/channels");
  return json<Channel[]>(res);
};

export const fetchChannel = async (id: string): Promise<Channel> => {
  const res = await fetch(`/api/channels/${id}`);
  return json<Channel>(res);
};

export const fetchChannelConversations = async (
  id: string,
): Promise<ConversationWithCount[]> => {
  const res = await fetch(`/api/channels/${id}/conversations`);
  return json<ConversationWithCount[]>(res);
};

export const createChannel = async (
  payload: CreateChannelPayload,
): Promise<Channel> => {
  const res = await fetch("/api/channels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return json<Channel>(res);
};

export const updateChannel = async (
  id: string,
  payload: UpdateChannelPayload,
): Promise<Channel> => {
  const res = await fetch(`/api/channels/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return json<Channel>(res);
};

export const deleteChannel = async (id: string): Promise<void> => {
  const res = await fetch(`/api/channels/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

// Health
export const checkHealth = async (): Promise<boolean> => {
  const res = await fetch("/api/health");
  const data: { status: string } = await res.json();
  return data.status === "ok";
};
