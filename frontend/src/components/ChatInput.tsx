import { type FormEvent, useRef } from "react";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
} from "@/components/ui/prompt-input";

interface ChatInputProps {
  onSend: (text: string) => void;
  isStreaming: boolean;
  onStop: () => void;
}

export default function ChatInput({
  onSend,
  isStreaming,
  onStop,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef("");

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = textareaRef.current?.value?.trim();
    if (!text || isStreaming) return;
    onSend(text);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
    inputRef.current = "";
  };

  return (
    <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm px-4 py-3">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto"
      >
        <PromptInput>
          <PromptInputTextarea
            ref={textareaRef}
            onChange={(e) => {
              inputRef.current = e.target.value;
            }}
            onSubmit={handleSubmit}
            placeholder="Type a message..."
          />
          <PromptInputActions>
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <title>Stop</title>
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
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
                  <title>Send</title>
                  <path d="m5 12 7-7 7 7" />
                  <path d="M12 19V5" />
                </svg>
              </button>
            )}
          </PromptInputActions>
        </PromptInput>
      </form>
      <p className="text-center text-xs text-gray-600 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
