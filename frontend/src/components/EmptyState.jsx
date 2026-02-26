const suggestions = [
  "Explain quantum computing simply",
  "Write a Python script for web scraping",
  "Help me brainstorm startup ideas",
  "Summarize a complex topic",
];

export default function EmptyState({ onSuggestion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" />
          <path d="M10 22h4" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
      <p className="text-gray-500 max-w-md text-sm mb-8">
        Ask me anything — I can help with writing, analysis, coding, math, and
        much more.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
        {suggestions.map((text) => (
          <button
            key={text}
            onClick={() => onSuggestion(text)}
            className="text-left px-4 py-3 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-gray-900 text-sm text-gray-400 transition-all cursor-pointer"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
