import { useState, useEffect, useCallback } from "react";

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      setConversations(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = useCallback(
    async (model) => {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model }),
        });
        const conv = await res.json();
        await fetchConversations();
        return conv;
      } catch {
        return null;
      }
    },
    [fetchConversations],
  );

  const loadConversation = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const deleteConversation = useCallback(
    async (id) => {
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
