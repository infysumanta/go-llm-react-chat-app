import { useRef } from "react";

export default function ChatInput({ onSend, isStreaming, onStop }) {
  const textareaRef = useRef(null);
  const inputRef = useRef("");

  const handleSubmit = (e) => {
    e?.preventDefault();
    const text = textareaRef.current?.value?.trim();
    if (!text || isStreaming) return;
    onSend(text);
    textareaRef.current.value = "";
    textareaRef.current.style.height = "auto";
    inputRef.current = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const autoResize = (el) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  return (
    <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm px-4 py-3">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto flex items-end gap-3"
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            onChange={(e) => {
              inputRef.current = e.target.value;
              autoResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full resize-none rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 pr-12 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          />
        </div>
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        )}
      </form>
      <p className="text-center text-xs text-gray-600 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
