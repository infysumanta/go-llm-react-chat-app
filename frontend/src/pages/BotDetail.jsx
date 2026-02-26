import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function BotDetail() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/channels/${channelId}`).then((r) => r.json()),
      fetch(`/api/channels/${channelId}/conversations`).then((r) => r.json()),
    ])
      .then(([ch, convs]) => {
        setChannel(ch);
        setConversations(convs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [channelId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-gray-800">
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold">
              {channel?.name || "Bot"} — Conversations
            </h1>
            <p className="text-xs text-gray-500">
              {channel?.botUsername && `@${channel.botUsername}`}
              {channel?.botUsername && " · "}
              {conversations.length} conversation
              {conversations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </header>

        {/* Conversations list */}
        <div className="p-6">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-3 text-gray-600"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-sm">No conversations yet.</p>
              <p className="text-xs mt-1">
                Send a message to this bot on Telegram to start a conversation.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => navigate(`/c/${conv.id}`)}
                  className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 hover:bg-gray-800 transition-colors cursor-pointer text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {conv.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {conv.messageCount} message
                      {conv.messageCount !== 1 ? "s" : ""} · Last active{" "}
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
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
                    className="text-gray-600 flex-shrink-0 ml-3"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
