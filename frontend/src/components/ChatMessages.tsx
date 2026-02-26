import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import "streamdown/styles.css";

interface ChatMessagesProps {
  messages: UIMessage[];
  isStreaming: boolean;
  modelPicture?: string;
}

export default function ChatMessages({
  messages,
  isStreaming,
  modelPicture,
}: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
      {messages.map((msg, index) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "assistant" && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex-shrink-0 flex items-center justify-center mt-1 overflow-hidden">
              {modelPicture ? (
                <img src={modelPicture} alt="Model" className="w-5 h-5" />
              ) : (
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
                  <title>Assistant</title>
                  <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" />
                  <path d="M10 22h4" />
                </svg>
              )}
            </div>
          )}
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-violet-600 text-white rounded-br-md whitespace-pre-wrap"
                : "bg-gray-800 text-gray-100 rounded-bl-md"
            }`}
          >
            {msg.role === "assistant" ? (
              getMessageText(msg) === "" && isStreaming ? (
                <TypingIndicator />
              ) : (
                <Streamdown
                  animated={{
                    animation: "blurIn",
                    duration: 200,
                    easing: "ease-out",
                  }}
                  isAnimating={isStreaming && index === messages.length - 1}
                  caret={
                    isStreaming && index === messages.length - 1
                      ? "block"
                      : undefined
                  }
                  plugins={{ code }}
                >
                  {getMessageText(msg)}
                </Streamdown>
              )
            ) : (
              getMessageText(msg)
            )}
          </div>
          {msg.role === "user" && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-500 flex-shrink-0 flex items-center justify-center mt-1 text-xs font-bold">
              U
            </div>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function getMessageText(msg: UIMessage): string {
  if (msg.parts) {
    return msg.parts
      .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return "";
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}
