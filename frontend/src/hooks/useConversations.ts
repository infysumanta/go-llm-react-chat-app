import { useCallback, useEffect, useState } from "react";

import type { Conversation, ConversationWithCount } from "../types";

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationWithCount[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data: ConversationWithCount[] = await res.json();
      setConversations(data);
      return data;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = useCallback(
    async (model: string) => {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model }),
        });
        const conv: Conversation = await res.json();
        await fetchConversations();
        return conv;
      } catch {
        return null;
      }
    },
    [fetchConversations],
  );

  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      return (await res.json()) as Conversation;
    } catch {
      return null;
    }
  }, []);

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/conversations/${id}`, { method: "DELETE" });
        await fetchConversations();
      } catch {
        // silently fail
      }
    },
    [fetchConversations],
  );

  return {
    conversations,
    loading,
    fetchConversations,
    createConversation,
    loadConversation,
    deleteConversation,
  };
}
