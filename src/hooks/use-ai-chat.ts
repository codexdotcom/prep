"use client";

import { useState, useCallback, useRef } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface UseAIChatOptions {
  questionId?: string;
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const idCounter = useRef(0);

  const genId = () => `msg-${Date.now()}-${idCounter.current++}`;

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      const loadingMsg: ChatMessage = {
        id: genId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            questionId: options.questionId,
            conversationHistory: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = await res.json();

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsg.id
              ? {
                  ...m,
                  content: data.response || data.error || "Sorry, I couldn't process that.",
                  isLoading: false,
                }
              : m
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsg.id
              ? {
                  ...m,
                  content: "Network error. Please try again.",
                  isLoading: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, options.questionId]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}