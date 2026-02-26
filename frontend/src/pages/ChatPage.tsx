import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ChatHeader from "@/components/ChatHeader";
import ChatInput from "@/components/ChatInput";
import ChatMessages from "@/components/ChatMessages";
import EmptyState from "@/components/EmptyState";
import Sidebar from "@/components/Sidebar";
import { useChannels } from "@/hooks/useChannels";
import { useConversations } from "@/hooks/useConversations";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import type { Model } from "@/types";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const isOnline = useHealthCheck();
  const {
    conversations,
    fetchConversations,
    loadConversation,
    deleteConversation,
  } = useConversations();
  const { channels } = useChannels();

  // Refs keep current values accessible inside the transport body function,
  // which is created once but called on every request.
  const selectedModelRef = useRef(selectedModel);
  const idRef = useRef(id);
  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);
  useEffect(() => { idRef.current = id; }, [id]);

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/chat",
        headers: { "Content-Type": "application/json" },
        body: async () => {
          console.log("[transport body] model:", selectedModelRef.current, "conversationId:", idRef.current);
          return {
            model: selectedModelRef.current,
            conversationId: idRef.current || null,
          };
        },
      }),
    [],
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const justCreated = useRef(false);
  const [activeChannel, setActiveChannel] = useState("web");

  // Fetch available models on mount and set default
  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((data: Model[]) => {
        setModels(data);
        const first = data[0];
        if (!selectedModel && first) {
          setSelectedModel(first.id);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load conversation when URL param changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run when id changes
  useEffect(() => {
    if (id) {
      if (justCreated.current) {
        justCreated.current = false;
        return;
      }
      loadConversation(id).then((conv) => {
        if (!conv) {
          navigate("/", { replace: true });
          return;
        }
        setSelectedModel(conv.model);
        setActiveChannel(conv.channel || "web");
        const sdkMessages = conv.messages.map((m) => ({
          id: m.id,
          role: m.role,
          parts: [{ type: "text" as const, text: m.content }],
        }));
        setMessages(sdkMessages);
      });
    } else {
      setMessages([]);
      setActiveChannel("web");
    }
  }, [id]);

  // After streaming completes, refresh conversations and navigate if new chat
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run on status/messages.length change
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      fetchConversations().then((convs) => {
        if (!id && convs && convs.length > 0) {
          const newest = convs.find((c) => !c.channel || c.channel === "web");
          if (newest) {
            justCreated.current = true;
            navigate(`/c/${newest.id}`, { replace: true });
          }
        }
      });
    }
  }, [status, messages.length]);

  const handleDeleteConversation = useCallback(
    async (convId: string) => {
      await deleteConversation(convId);
      if (convId === id) {
        navigate("/");
      }
    },
    [deleteConversation, id, navigate],
  );

  const handleSend = useCallback(
    (text: string) => {
      console.log("[ChatPage] handleSend — selectedModel:", selectedModel, "ref:", selectedModelRef.current);
      sendMessage({ text });
    },
    [sendMessage, selectedModel],
  );

  const handleSuggestion = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend],
  );

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <Sidebar
        conversations={conversations}
        channels={channels}
        activeId={id}
        onSelect={(conv) => navigate(`/c/${conv.id}`)}
        onNew={() => {
          setMessages([]);
          navigate("/");
        }}
        onDelete={handleDeleteConversation}
        onSettings={() => navigate("/settings")}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          isOnline={isOnline}
          onOpenSettings={() => navigate("/settings")}
        />
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onSuggestion={handleSuggestion} />
          ) : (
            <ChatMessages messages={messages} isStreaming={isStreaming} />
          )}
        </div>
        {activeChannel === "telegram" ? (
          <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm px-4 py-3">
            <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Telegram</title>
                <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-16.5 8.25a2.25 2.25 0 0 0 .126 4.073l4.5 1.5 2.25 6a1.5 1.5 0 0 0 2.652.378L15.5 19.5l4.5 1.5a2.25 2.25 0 0 0 2.965-1.768l1.5-15A2.25 2.25 0 0 0 21.198 2.433z" />
              </svg>
              Telegram conversation — reply from Telegram to continue
            </div>
          </div>
        ) : (
          <ChatInput
            onSend={handleSend}
            isStreaming={isStreaming}
            onStop={stop}
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            status={status}
          />
        )}
      </main>
    </div>
  );
}
