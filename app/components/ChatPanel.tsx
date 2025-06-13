"use client";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}

export default function ChatPanel({ messages, onSend }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : ""}`}>
            <div
              className={`rounded-lg px-4 py-2 max-w-[75%] text-sm ${msg.role === "user" ? "bg-blue-500 text-white whitespace-pre-wrap" : "bg-gray-100 text-gray-800"}`}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown 
                  components={{
                    // Customize paragraph spacing
                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                    // Customize code blocks
                    code: ({className, children, ...props}) => {
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <pre className="bg-gray-800 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                          <code {...props}>{children}</code>
                        </pre>
                      ) : (
                        <code className="bg-gray-200 px-1 py-0.5 rounded text-xs" {...props}>
                          {children}
                        </code>
                      );
                    },
                    // Customize lists
                    ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                    li: ({children}) => <li className="mb-1">{children}</li>,
                    // Customize headings
                    h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                    h2: ({children}) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                    h3: ({children}) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="border-t p-2">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
            placeholder="Ask any question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
            onClick={handleSubmit}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
} 