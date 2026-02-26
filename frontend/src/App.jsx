import { useState, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import EmptyState from "./components/EmptyState";
import { useHealthCheck } from "./hooks/useHealthCheck";
import { useConversations } from "./hooks/useConversations";

const DEFAULT_MODEL = "gpt-4o-mini";

function App() {
  const [activeConvId, setActiveConvId] = useState(null);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [models, setModels] = useState([]);
  const isOnline = useHealthCheck();
  const {
    conversations,
    fetchConversations,
    loadConversation,
    deleteConversation,
  } = useConversations();

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      body: { conversationId: activeConvId, model: selectedModel },
      headers: { "Content-Type": "application/json" },
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Fetch available models on mount
  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then(setModels)
      .catch(() => {});
  }, []);

  // After streaming completes, refresh the conversation list to pick up new titles
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      fetchConversations();
    }
  }, [status, messages.length, fetchConversations]);

  const handleSelectConversation = useCallback(
    async (id) => {
      const conv = await loadConversation(id);
      if (!conv) return;
      setActiveConvId(conv.id);
      setSelectedModel(conv.model);

      // Convert DB messages to AI SDK format
      const sdkMessages = conv.messages.map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.content }],
      }));
      setMessages(sdkMessages);
    },
    [loadConversation, setMessages],
  );

  const handleNewChat = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
  }, [setMessages]);

  const handleDeleteConversation = useCallback(
    async (id) => {
      await deleteConversation(id);
      if (id === activeConvId) {
        handleNewChat();
      }
    },
    [deleteConversation, activeConvId, handleNewChat],
  );

  const handleSend = useCallback(
    (text) => {
      sendMessage({ text });
      // After first message, capture the conversation ID from response header
      if (!activeConvId) {
        // The conversation ID will be set from the response
        // We'll pick it up on the next conversation list refresh
        setTimeout(() => fetchConversations(), 1000);
      }
    },
    [sendMessage, activeConvId, fetchConversations],
  );

  const handleSuggestion = useCallback(
    (text) => {
      handleSend(text);
    },
    [handleSend],
  );

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          isOnline={isOnline}
        />
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onSuggestion={handleSuggestion} />
          ) : (
            <ChatMessages messages={messages} isStreaming={isStreaming} />
          )}
        </div>
        <ChatInput
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={stop}
        />
      </main>
    </div>
  );
}

export default App;
