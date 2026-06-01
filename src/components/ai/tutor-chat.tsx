"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  X,
  Brain,
  Loader2,
  Trash2,
  Maximize2,
  Minimize2,
} from "lucide-react";
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send initial message
  useEffect(() => {
    if (isOpen && initialMessage && !hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true;
      sendMessage(initialMessage);
    }
  }, [isOpen, initialMessage, messages.length, sendMessage]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
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
        background: "var(--color-surface-card)",
        border: isExpanded ? "none" : "1px solid var(--color-surface-border)",
        borderRadius: isExpanded ? "0" : "1rem",
        boxShadow: isExpanded ? "none" : "var(--shadow-elevated)",
        animation: "var(--animate-scale-in)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-surface-border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(34, 197, 94, 0.1)" }}
          >
            <Brain className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              JAMB OS
            </p>
            <p className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>
              Your JAMB tutor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={clearChat} className="btn-ghost" style={{ padding: "0.375rem" }} title="Clear chat">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-ghost hidden sm:flex"
            style={{ padding: "0.375rem" }}
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "0.375rem" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Brain
              className="mx-auto mb-3 h-8 w-8"
              style={{ color: "var(--color-text-muted)" }}
            />
            <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
              Ask me anything about JAMB
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
              I can explain concepts, solve problems, and help you study
            </p>

            {/* Suggested questions */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {SUGGESTED_QUESTIONS.slice(0, questionId ? 5 : 3).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-full px-3 py-1.5 text-xs transition-all"
                  style={{
                    background: "var(--color-surface-lighter)",
                    border: "1px solid var(--color-surface-border)",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3"
              style={{
                background:
                  msg.role === "user"
                    ? "var(--color-accent-green)"
                    : "var(--color-surface-lighter)",
                color:
                  msg.role === "user"
                    ? "var(--color-surface)"
                    : "var(--color-text-primary)",
                borderBottomRightRadius: msg.role === "user" ? "0.375rem" : undefined,
                borderBottomLeftRadius: msg.role === "assistant" ? "0.375rem" : undefined,
              }}
            >
              {msg.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-accent-green)" }} />
                  <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                    Thinking...
                  </span>
                </div>
              ) : msg.role === "assistant" ? (
                <Markdown content={msg.content} />
              ) : (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 px-4 py-3"
        style={{ borderTop: "1px solid var(--color-surface-border)" }}
      >
        <div
          className="flex items-end gap-2 rounded-xl p-2"
          style={{
            background: "var(--color-surface-light)",
            border: "1px solid var(--color-surface-border)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none"
            style={{
              color: "var(--color-text-primary)",
              maxHeight: "120px",
              minHeight: "36px",
              lineHeight: "1.5",
              padding: "0.375rem 0.5rem",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "36px";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all"
            style={{
              background: input.trim() ? "var(--color-accent-green)" : "transparent",
              color: input.trim() ? "var(--color-surface)" : "var(--color-text-muted)",
              opacity: input.trim() && !isLoading ? 1 : 0.4,
            }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <p
          className="text-center mt-2 text-[0.5625rem]"
          style={{ color: "var(--color-text-muted)" }}
        >
          JAMB OS AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}