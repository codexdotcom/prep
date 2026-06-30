"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle, Plus, Loader2, Send, Trash2,
  Clock, Brain, ChevronLeft, ArrowLeft,
} from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import { Paywall } from "@/components/ui/paywall";
import { PageFooter } from "@/components/ui/page-footer";

interface Message { id: string; role: string; content: string; createdAt: string }
interface Conversation { id: string; title: string; subject: string | null; updatedAt: string; messages: Message[] }

const PROMPTS = [
  "Explain photosynthesis step by step",
  "How do I solve quadratic equations?",
  "What is Ohm's law and how is it applied?",
  "Explain the concept of demand and supply",
  "Help me understand cell division",
  "What are the key themes in Macbeth?",
  "Explain the mole concept in chemistry",
  "How do I identify figures of speech?",
];

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [showPaywall, setShowPaywall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/chat").then((r) => r.json()).then((d) => setConversations(Array.isArray(d) ? d : []))
      .catch(() => setConversations([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const openConversation = async (id: string) => {
    const res = await fetch(`/api/chat/${id}`);
    const data = await res.json();
    if (res.ok) {
      setActiveConvo(data); setMessages(data.messages || []); setView("chat");
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  };

  const startNew = () => { setActiveConvo(null); setMessages([]); setView("chat"); setShowPaywall(false); setTimeout(() => inputRef.current?.focus(), 200); };

  const startWithPrompt = (prompt: string) => {
    setActiveConvo(null); setMessages([]); setView("chat"); setShowPaywall(false);
    setTimeout(() => { setInput(prompt); inputRef.current?.focus(); }, 200);
  };

  const sendMessage = async (overrideMsg?: string) => {
    const msg = (overrideMsg || input).trim();
    if (!msg || sending) return;

    // Check usage before sending
    try {
      const usageRes = await fetch("/api/usage/check?feature=chat");
      const usageData = await usageRes.json();
      if (usageData.allowed === false) { setShowPaywall(true); return; }
    } catch {}

    setInput(""); setSending(true); setShowPaywall(false);

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: "user", content: msg, createdAt: new Date().toISOString() }]);

    const loadId = `load-${Date.now()}`;
    setMessages((prev) => [...prev, { id: loadId, role: "assistant", content: "...", createdAt: new Date().toISOString() }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConvo?.id, message: msg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (!activeConvo) {
        setActiveConvo({ id: data.conversationId, title: msg.slice(0, 60), subject: null, updatedAt: new Date().toISOString(), messages: [] });
      }

      setMessages((prev) => prev.filter((m) => m.id !== loadId).concat({
        id: `reply-${Date.now()}`, role: "assistant", content: data.reply, createdAt: new Date().toISOString(),
      }));

      // Record usage
      fetch("/api/usage/record", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feature: "chat" }) }).catch(() => {});
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== loadId));
    }
    setSending(false);
  };

  const deleteConvo = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    await fetch(`/api/chat/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvo?.id === id) { setView("list"); setActiveConvo(null); setMessages([]); }
  };

  const goBackToList = () => {
    setView("list"); setShowPaywall(false);
    fetch("/api/chat").then((r) => r.json()).then((d) => setConversations(Array.isArray(d) ? d : []));
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30 shrink-0" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => view === "chat" ? goBackToList() : router.push("/tutor")}
            className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            {view === "chat" ? <ChevronLeft className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span className="hidden sm:inline">{view === "chat" ? "All chats" : "Back"}</span>
          </button>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" style={{ color: "#8b5cf6" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>
              {view === "chat" && activeConvo ? activeConvo.title.slice(0, 25) + (activeConvo.title.length > 25 ? "..." : "") : "Conversations"}
            </span>
          </div>
          <div className="flex items-center" style={{ width: 60, justifyContent: "flex-end" }}>
            {view === "list" && (
              <button onClick={startNew} className="p-2 rounded-md" style={{ color: "#555" }}>
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ═══ LIST ═══ */}
      {view === "list" && (
        <div className="mx-auto max-w-2xl w-full px-4 pt-6 pb-12 flex-1">
          <div className="mb-6">
            <h1 className="text-xl font-semibold" style={{ color: "#111" }}>Your conversations</h1>
            <p className="text-sm mt-0.5" style={{ color: "#aaa" }}>
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""} saved
            </p>
          </div>

          <button onClick={startNew}
            className="w-full rounded-xl py-3 mb-5 text-sm font-semibold active:scale-[0.98]"
            style={{ background: "#111", color: "#fff" }}>
            New Conversation
          </button>

          <div className="mb-5">
            <p className="text-[0.625rem] font-medium uppercase tracking-wider mb-2" style={{ color: "#bbb" }}>Try asking</p>
            <div className="flex flex-wrap gap-1.5">
              {PROMPTS.slice(0, 6).map((p) => (
                <button key={p} onClick={() => startWithPrompt(p)}
                  className="rounded-md px-2.5 py-1.5 text-xs transition-colors"
                  style={{ background: "#fcfcfc", border: "1px solid #e8e8e8", color: "#555" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "#aaa" }} /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 rounded-xl" style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
              <MessageCircle className="mx-auto h-7 w-7 mb-2" style={{ color: "#ddd" }} />
              <p className="text-sm" style={{ color: "#555" }}>No conversations yet</p>
              <p className="text-xs mt-0.5" style={{ color: "#aaa" }}>Start one above or tap a prompt.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[0.625rem] font-medium uppercase tracking-wider mb-1" style={{ color: "#bbb" }}>Recent</p>
              {conversations.map((c) => {
                const lastMsg = c.messages?.[0];
                return (
                  <div key={c.id} className="group flex items-center gap-3 rounded-lg p-3 transition-colors"
                    style={{ background: "#fff", border: "1px solid #e8e8e8" }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md shrink-0" style={{ background: "#f5f3ff" }}>
                      <MessageCircle className="h-3.5 w-3.5" style={{ color: "#8b5cf6" }} />
                    </div>
                    <button onClick={() => openConversation(c.id)} className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate" style={{ color: "#111" }}>{c.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {lastMsg && (
                          <p className="text-[0.6875rem] truncate max-w-[180px]" style={{ color: "#aaa" }}>
                            {lastMsg.content.slice(0, 50)}{lastMsg.content.length > 50 ? "..." : ""}
                          </p>
                        )}
                        <span className="flex items-center gap-0.5 text-[0.5625rem] shrink-0" style={{ color: "#ccc" }}>
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(c.updatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </button>
                    <button onClick={() => deleteConvo(c.id)} className="p-1 rounded shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#ccc" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#ccc"; }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <PageFooter />
        </div>
      )}

      {/* ═══ CHAT ═══ */}
      {view === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto mx-auto max-w-3xl w-full">
            <div className="px-4 py-4">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#f5f5f5" }}>
                    <Brain className="h-6 w-6" style={{ color: "#333" }} />
                  </div>
                  <h2 className="text-base font-semibold" style={{ color: "#111" }}>What would you like to learn?</h2>
                  <p className="text-xs mt-1 mb-5" style={{ color: "#aaa" }}>Your conversation is saved automatically.</p>
                  <div className="flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
                    {PROMPTS.map((p) => (
                      <button key={p} onClick={() => sendMessage(p)}
                        className="rounded-md px-2.5 py-1.5 text-xs text-left transition-colors"
                        style={{ background: "#fcfcfc", border: "1px solid #e8e8e8", color: "#555" }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%]">
                      <p className={`text-[0.5625rem] font-medium mb-1 ${msg.role === "user" ? "text-right" : "text-left"}`}
                        style={{ color: "#bbb" }}>
                        {msg.role === "user" ? "You" : "JambOS"}
                      </p>
                      <div className="rounded-2xl px-4 py-3"
                        style={{
                          background: msg.role === "user" ? "#111" : "#fff",
                          border: msg.role === "assistant" ? "1px solid #e8e8e8" : "none",
                          borderBottomRightRadius: msg.role === "user" ? "0.375rem" : undefined,
                          borderBottomLeftRadius: msg.role === "assistant" ? "0.375rem" : undefined,
                        }}>
                        {msg.content === "..." ? (
                          <div className="flex items-center gap-2 py-1">
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "#aaa", animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                              ))}
                            </div>
                            <span className="text-xs" style={{ color: "#aaa" }}>Thinking</span>
                          </div>
                        ) : msg.role === "assistant" ? (
                          <div className="prose-chat text-sm" style={{ color: "#333", lineHeight: 1.7 }}>
                            <Markdown content={msg.content} />
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed" style={{ color: "#fff" }}>{msg.content}</p>
                        )}
                      </div>
                      <p className={`text-[0.5rem] mt-0.5 ${msg.role === "user" ? "text-right" : "text-left"}`} style={{ color: "#ddd" }}>
                        {new Date(msg.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Paywall */}
          {showPaywall && (
            <div className="px-4 py-3 mx-auto max-w-lg w-full">
              <Paywall feature="chat" used={0} limit={0} tier="FREE" />
              <button onClick={() => setShowPaywall(false)} className="w-full text-center mt-2 text-xs" style={{ color: "#aaa" }}>Dismiss</button>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 mx-auto max-w-3xl w-full" style={{ background: "#fff", borderTop: "1px solid #eee" }}>
            <div className="px-4 py-3">
              <div className="flex items-end gap-2 rounded-lg p-2" style={{ background: "#f5f5f5", border: "1px solid #e8e8e8" }}>
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Ask anything about JAMB..." rows={1}
                  className="flex-1 resize-none bg-transparent text-sm outline-none"
                  style={{ color: "#111", maxHeight: 120, minHeight: 36, lineHeight: 1.5, padding: "0.375rem 0.5rem" }}
                  onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "36px"; t.style.height = `${Math.min(t.scrollHeight, 120)}px`; }} />
                <button onClick={() => sendMessage()} disabled={!input.trim() || sending}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all"
                  style={{ background: input.trim() ? "#111" : "transparent", color: input.trim() ? "#fff" : "#ccc", opacity: input.trim() && !sending ? 1 : 0.4 }}>
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-center mt-1.5 text-[0.5rem]" style={{ color: "#ccc" }}>
                JambOS AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>

          <style>{`@keyframes dotPulse { 0%,60%,100% { opacity: 0.3; transform: scale(0.8); } 30% { opacity: 1; transform: scale(1.2); } }`}</style>
        </>
      )}
    </div>
  );
}