export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}) {
  return (
    <aside className="hidden md:flex w-64 flex-col bg-gray-900 border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <button
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
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
              conv.id === activeId
                ? "bg-gray-800 text-gray-100"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
            }`}
          >
            <span className="flex-1 truncate">{conv.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
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
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
