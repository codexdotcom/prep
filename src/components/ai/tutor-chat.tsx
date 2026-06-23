"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Brain, Loader2, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { useAIChat } from "@/hooks/use-ai-chat";
import { Markdown } from "@/components/ui/markdown";

interface TutorChatProps {
  questionId?: string;
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

const SUGGESTED_QUESTIONS = [
  "Can you explain this step by step?",
  "Why is my answer wrong?",
  "Give me a simpler example",
  "What topic should I revise for this?",
  "Show me a similar question",
];

export function TutorChat({ questionId, isOpen, onClose, initialMessage }: TutorChatProps) {
  const { messages, isLoading, sendMessage, clearChat } = useAIChat({ questionId });
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && initialMessage && !hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true;
      sendMessage(initialMessage);
    }
  }, [isOpen, initialMessage, messages.length, sendMessage]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Reset init flag when closed
  useEffect(() => {
    if (!isOpen) hasInitialized.current = false;
  }, [isOpen]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 flex flex-col"
      style={{
        bottom: isExpanded ? "0" : "1rem",
        right: isExpanded ? "0" : "1rem",
        left: isExpanded ? "0" : "auto",
        top: isExpanded ? "0" : "auto",
        width: isExpanded ? "100%" : "min(420px, calc(100vw - 2rem))",
        height: isExpanded ? "100%" : "min(600px, calc(100vh - 6rem))",
        background: "#fff",
        border: isExpanded ? "none" : "1px solid #e5e5e5",
        borderRadius: isExpanded ? "0" : "1rem",
        boxShadow: isExpanded ? "none" : "0 4px 24px rgba(0,0,0,0.12)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid #eee" }}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#f5f5f5" }}>
            <Brain className="h-4 w-4" style={{ color: "#333" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#111" }}>JambOS Tutor</p>
            <p className="text-[0.625rem]" style={{ color: "#999" }}>Ask me anything</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={clearChat} className="p-1.5 rounded-lg transition-colors" style={{ color: "#999" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              title="Clear chat">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => setIsExpanded(!isExpanded)}
            className="hidden sm:flex p-1.5 rounded-lg transition-colors" style={{ color: "#999" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: "#999" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: "#fafafa" }}>
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Brain className="mx-auto mb-3 h-8 w-8" style={{ color: "#ccc" }} />
            <p className="text-sm font-medium mb-1" style={{ color: "#333" }}>Ask me anything about JAMB</p>
            <p className="text-xs mb-4" style={{ color: "#999" }}>I can explain concepts, solve problems, and help you study</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {SUGGESTED_QUESTIONS.slice(0, questionId ? 5 : 3).map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="rounded-lg px-3 py-1.5 text-xs transition-all"
                  style={{ background: "#fff", border: "1px solid #eee", color: "#555" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0f0"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3"
              style={{
                background: msg.role === "user" ? "#111" : "#fff",
                color: msg.role === "user" ? "#fff" : "#333",
                border: msg.role === "assistant" ? "1px solid #eee" : "none",
                borderBottomRightRadius: msg.role === "user" ? "0.375rem" : undefined,
                borderBottomLeftRadius: msg.role === "assistant" ? "0.375rem" : undefined,
              }}
            >
              {msg.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#999" }} />
                  <span className="text-sm" style={{ color: "#999" }}>Thinking...</span>
                </div>
              ) : msg.role === "assistant" ? (
                <div className="prose-chat">
                  <Markdown content={msg.content} />
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid #eee", background: "#fff" }}>
        <div className="flex items-end gap-2 rounded-xl p-2" style={{ background: "#f5f5f5", border: "1px solid #eee" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none"
            style={{ color: "#111", maxHeight: "120px", minHeight: "36px", lineHeight: "1.5", padding: "0.375rem 0.5rem" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "36px";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <button onClick={handleSubmit} disabled={!input.trim() || isLoading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all"
            style={{ background: input.trim() ? "#111" : "transparent", color: input.trim() ? "#fff" : "#ccc", opacity: input.trim() && !isLoading ? 1 : 0.4 }}>
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-center mt-2 text-[0.5625rem]" style={{ color: "#bbb" }}>
          JambOS AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}