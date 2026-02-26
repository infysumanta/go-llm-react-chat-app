import { useCallback, useEffect, useState } from "react";

import type {
  Channel,
  CreateChannelPayload,
  UpdateChannelPayload,
} from "../types";

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/channels");
      const data: Channel[] = await res.json();
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
    async (payload: CreateChannelPayload) => {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const channel: Channel = await res.json();
      await fetchChannels();
      return channel;
    },
    [fetchChannels],
  );

  const updateChannel = useCallback(
    async (id: string, updates: UpdateChannelPayload) => {
      const res = await fetch(`/api/channels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const channel: Channel = await res.json();
      await fetchChannels();
      return channel;
    },
    [fetchChannels],
  );

  const deleteChannel = useCallback(
    async (id: string) => {
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
