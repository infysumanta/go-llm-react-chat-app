import { useState, useEffect, useCallback } from "react";

export function useChannels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/channels");
      const data = await res.json();
      setChannels(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const createChannel = useCallback(
    async ({ name, botToken, systemPrompt, model }) => {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, botToken, systemPrompt, model }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const channel = await res.json();
      await fetchChannels();
      return channel;
    },
    [fetchChannels],
  );

  const updateChannel = useCallback(
    async (id, updates) => {
      const res = await fetch(`/api/channels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const channel = await res.json();
      await fetchChannels();
      return channel;
    },
    [fetchChannels],
  );

  const deleteChannel = useCallback(
    async (id) => {
      await fetch(`/api/channels/${id}`, { method: "DELETE" });
      await fetchChannels();
    },
    [fetchChannels],
  );

  return {
    channels,
    loading,
    fetchChannels,
    createChannel,
    updateChannel,
    deleteChannel,
  };
}
