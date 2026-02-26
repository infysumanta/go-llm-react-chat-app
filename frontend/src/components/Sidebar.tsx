import type { Channel, ConversationWithCount } from "../types";

interface SidebarProps {
  conversations: ConversationWithCount[];
  channels?: Channel[];
  activeId?: string;
  onSelect: (conv: ConversationWithCount) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSettings?: () => void;
}

export default function Sidebar({
  conversations,
  channels = [],
  activeId,
  onSelect,
  onNew,
  onDelete,
  onSettings,
}: SidebarProps) {
  const channelMap: Record<string, string> = {};
  for (const ch of channels) {
    channelMap[ch.id] = ch.name;
  }

  return (
    <aside className="hidden md:flex w-64 flex-col bg-gray-900 border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <button
          type="button"
          onClick={onNew}
          className="w-full flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
        >
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
            <title>New chat</title>
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
          Recent
        </p>
        {conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conv={conv}
            isActive={conv.id === activeId}
            channelName={
              conv.channelId ? channelMap[conv.channelId] : undefined
            }
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
      {onSettings && (
        <div className="p-2 border-t border-gray-800">
          <button
            type="button"
            onClick={onSettings}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 transition-colors cursor-pointer"
          >
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
              <title>Settings</title>
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Settings
          </button>
        </div>
      )}
    </aside>
  );
}

function ConversationItem({
  conv,
  isActive,
  channelName,
  onSelect,
  onDelete,
}: {
  conv: ConversationWithCount;
  isActive: boolean;
  channelName?: string;
  onSelect: (conv: ConversationWithCount) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
        isActive
          ? "bg-gray-800 text-gray-100"
          : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(conv)}
        className="flex-1 truncate flex items-center gap-1.5 text-left"
      >
        {conv.channel === "telegram" && (
          <span className="inline-flex shrink-0 items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
            TG
            {conv.channelId && channelName ? `: ${channelName}` : ""}
          </span>
        )}
        <span className="truncate">{conv.title}</span>
      </button>
      <button
        type="button"
        onClick={() => onDelete(conv.id)}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Delete</title>
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>
  );
}
