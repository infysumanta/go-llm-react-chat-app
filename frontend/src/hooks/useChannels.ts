import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createChannel,
  deleteChannel,
  fetchChannelConversations,
  fetchChannel,
  fetchChannels,
  updateChannel,
} from "@/api";
import type { CreateChannelPayload, UpdateChannelPayload } from "@/types";

export function useChannels() {
  return useQuery({
    queryKey: ["channels"],
    queryFn: fetchChannels,
  });
}

export function useChannel(id: string | undefined) {
  return useQuery({
    queryKey: ["channels", id],
    queryFn: () => fetchChannel(id!),
    enabled: !!id,
  });
}

export function useChannelConversations(id: string | undefined) {
  return useQuery({
    queryKey: ["channels", id, "conversations"],
    queryFn: () => fetchChannelConversations(id!),
    enabled: !!id,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChannelPayload) => createChannel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: { id: string; payload: UpdateChannelPayload }) =>
      updateChannel(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}
