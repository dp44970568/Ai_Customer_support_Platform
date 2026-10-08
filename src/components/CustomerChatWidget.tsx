"use client";

import React, { useState } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Star, 
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Radio
} from "lucide-react";

interface CustomerChatWidgetProps {
  onTicketUpdated?: () => void;
}

interface MessageItem {
  id?: string;
  sender: "customer" | "ai" | "agent" | "system";
  text: string;
  time: string;
  suggestions?: string[];
  isStreaming?: boolean;
}

const PRESET_QUERIES = [
  {
    label: "Refund Request",
    text: "I was billed $948 yesterday for annual renewal and need a refund immediately!",
    badge: "Billing / 14-day policy"
  },
  {
    label: "API 429 Rate Limit",
    text: "We are getting 429 Too Many Requests errors in our webhook endpoint. How do we fix this?",
    badge: "Technical / RAG"
  },
  {
    label: "Human Escalation",
    text: "This is completely broken! I need to speak to a human agent and manager right now!",
    badge: "Escalation Trigger"
  },
  {
    label: "Okta SAML SSO",
    text: "Where can I find our ACS URL and SP Entity ID to configure Okta SSO?",
    badge: "Security / Account"
  }
];

export const CustomerChatWidget: React.FC<CustomerChatWidgetProps> = ({ onTicketUpdated }) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      sender: "ai",
      text: "👋 Hi there! I'm OmniSupport AI, your assistant for Nexus Cloud Technologies. How can I help you today? You can ask about billing, APIs, security, or request a human specialist.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: ["Billing & Invoices", "API Rate Limits", "Talk to a Human Agent"]
    }
  ]);

  const [input, setInput] = useState("");
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isEscalated, setIsEscalated] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [csatScore, setCsatScore] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("Jamie Fox");
  const [customerEmail, setCustomerEmail] = useState("jamie.f@innovate.co");

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMsg: MessageItem = {
      sender: "customer",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const streamingId = `stream-${Date.now()}`;
    const initialAiMsg: MessageItem = {
      id: streamingId,
      sender: "ai",
      text: "",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, initialAiMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeTicketId,
          customerName,
          customerEmail,
          message: textToSend,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to initialize stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmed.substring(6));

              if (data.type === "token") {
                accumulatedText += data.text;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === streamingId
                      ? { ...m, text: accumulatedText }
                      : m
                  )
                );
              } else if (data.type === "done") {
                if (data.ticket?.id) {
                  setActiveTicketId(data.ticket.id);
                }
                if (data.analysis?.shouldEscalate || data.ticket?.status === "escalated") {
                  setIsEscalated(true);
                }

                setMessages(prev =>
                  prev.map(m =>
                    m.id === streamingId
                      ? {
                          ...m,
                          text: data.replyMessage?.text || accumulatedText,
                          isStreaming: false,
                          suggestions: data.replyMessage?.suggestedActions || [],
                        }
                      : m
                  )
                );

                onTicketUpdated?.();
              }
            } catch (err) {
              console.error("Error parsing streaming chunk:", err);
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat streaming error:", err);
      setMessages(prev =>
        prev.map(m =>
          m.id === streamingId
            ? {
                ...m,
                text: "Sorry, I encountered an issue processing your request. Please try again or reach out to our team.",
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleCSAT = async (score: number) => {
    setCsatScore(score);
    if (activeTicketId) {
      try {
        await fetch(`/api/tickets/${activeTicketId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ satisfactionScore: score, status: "resolved" }),
        });
        onTicketUpdated?.();
      } catch (e) {
        console.error("CSAT submission error:", e);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-4xl h-[92%] flex flex-col md:flex-row gap-6">
        
        {/* Left Simulator Controls */}
        <div className="w-full md:w-80 flex flex-col gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Customer Simulator
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Simulate customer inquiries or trigger test scenarios to see the AI RAG & human escalation in action.
            </p>
          </div>

          {/* User Profile Config */}
          <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Simulated User</span>
            <div>
              <label className="text-[10px] text-slate-500 block">Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Quick Test Scenarios */}
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Test Prompts (Click to Send)
            </span>
            {PRESET_QUERIES.map((q, idx) => (
              <button
                key={idx}
                disabled={isTyping}
                onClick={() => sendMessage(q.text)}
                className="w-full text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 hover:border-slate-700 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400">
                    {q.label}
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                    {q.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  &ldquo;{q.text}&rdquo;
                </p>
              </button>
            ))}
          </div>

          {/* Escalation Status Box */}
          {isEscalated && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-rose-300">Escalated to Human</span>
                <p className="text-[11px] text-rose-200/80 mt-0.5 leading-snug">
                  Customer requested human or sentiment triggered escalation. Ticket is in agent inbox!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Live Chat Window */}
        <div className="flex-1 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">OmniSupport AI Assistant</h4>
                  {isEscalated ? (
                    <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Human Specialist Queued
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" /> SSE Streaming & RAG
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Powered by Nexus Knowledge Base & Gemini AI</p>
              </div>
            </div>

            {activeTicketId && (
              <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                Ticket: {activeTicketId}
              </span>
            )}
          </div>

          {/* Messages Timeline */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, idx) => {
              const isCust = m.sender === "customer";
              return (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    isCust ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl p-4 shadow-sm text-xs leading-relaxed whitespace-pre-line ${
                      isCust
                        ? "bg-emerald-600 text-white rounded-br-none"
                        : "bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-none"
                    }`}
                  >
                    {m.text ? (
                      <>
                        {m.text}
                        {m.isStreaming && (
                          <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1 animate-pulse align-middle" />
                        )}
                      </>
                    ) : m.isStreaming ? (
                      <span className="flex items-center gap-1.5 text-slate-400 italic">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                        Generating response...
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>

                  {/* Quick Action Suggestion Chips from AI */}
                  {m.suggestions && m.suggestions.length > 0 && !m.isStreaming && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => sendMessage(sug)}
                          className="text-[11px] bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-full border border-slate-700/80 transition-all font-medium flex items-center gap-1"
                        >
                          <span>{sug}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CSAT Rating prompt if escalated or closed */}
          {activeTicketId && (
            <div className="px-5 py-2.5 bg-slate-950/70 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">Rate your experience:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleCSAT(star)}
                    className={`p-1 transition-all ${
                      csatScore && csatScore >= star
                        ? "text-amber-400 scale-110"
                        : "text-slate-600 hover:text-amber-300"
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                ))}
              </div>
              {csatScore && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Feedback recorded ({csatScore}/5)
                </span>
              )}
            </div>
          )}

          {/* Input Composer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/60">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask a question, report an issue, or ask for human support..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
