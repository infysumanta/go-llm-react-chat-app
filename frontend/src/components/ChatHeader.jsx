export default function ChatHeader({
  models,
  selectedModel,
  onModelChange,
  isOnline,
}) {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" />
            <path d="M10 22h4" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-semibold">LLM Chat</h1>
          <p className="text-xs text-gray-500">AI Assistant</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isOnline === null
              ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
              : isOnline
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOnline === null
                ? "bg-gray-400"
                : isOnline
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-red-400"
            }`}
          />
          {isOnline === null ? "Checking..." : isOnline ? "Online" : "Offline"}
        </span>
      </div>
    </header>
  );
}
