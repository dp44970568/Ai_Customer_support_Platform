"use client";

import React, { useState, useEffect } from "react";
import { Ticket, TicketStatus, TicketPriority, TicketCategory, Agent } from "@/types";
import { AGENTS } from "@/lib/store";
import { 
  AlertTriangle, 
  Bot,
  CheckCircle2, 
  Clock, 
  Flame, 
  Lock, 
  MessageSquare, 
  Send, 
  Sparkles, 
  User, 
  UserCheck, 
  Search, 
  Tag, 
  ArrowUpRight, 
  FileText, 
  HelpCircle,
  Lightbulb,
  CornerDownRight,
  RefreshCw
} from "lucide-react";

interface AgentDashboardProps {
  onRefreshMetrics?: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ onRefreshMetrics }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Reply Composer State
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Copilot State
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotDraft, setCopilotDraft] = useState<string | null>(null);
  const [copilotSummary, setCopilotSummary] = useState<string | null>(null);
  const [copilotActionPoints, setCopilotActionPoints] = useState<string[]>([]);

  // Fetch Tickets
  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
        if (!selectedTicketId && data.tickets.length > 0) {
          setSelectedTicketId(data.tickets[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching tickets:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 8000);
    return () => clearInterval(interval);
  }, []);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  // Fetch Copilot suggestions when selected ticket changes
  useEffect(() => {
    if (selectedTicket) {
      setCopilotDraft(null);
      setCopilotSummary(selectedTicket.aiSummary || null);
      setCopilotActionPoints([]);
    }
  }, [selectedTicketId]);

  const handleGenerateCopilot = async () => {
    if (!selectedTicket) return;
    setCopilotLoading(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/copilot`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setCopilotDraft(data.suggestedReply);
        setCopilotSummary(data.summary);
        setCopilotActionPoints(data.actionPoints || []);
      }
    } catch (e) {
      console.error("Copilot error:", e);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Status and assignment updates
  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
        onRefreshMetrics?.();
      }
    } catch (e) {
      console.error("Status update error:", e);
    }
  };

  const handleUpdatePriority = async (newPriority: TicketPriority) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
      }
    } catch (e) {
      console.error("Priority update error:", e);
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    if (!selectedTicket) return;
    const agent = AGENTS.find(a => a.id === agentId);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          assignedAgent: agentId, 
          assignedAgentName: agent ? agent.name : undefined 
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
      }
    } catch (e) {
      console.error("Agent assignment error:", e);
    }
  };

  // Send message or internal note
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedTicket || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "agent",
          senderName: "Sarah Jenkins (Agent)",
          text: replyText.trim(),
          isInternalNote,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
        setReplyText("");
        onRefreshMetrics?.();
      }
    } catch (e) {
      console.error("Send message error:", e);
    } finally {
      setIsSending(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (categoryFilter !== "all" && ticket.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSub = ticket.subject.toLowerCase().includes(q);
      const matchName = ticket.customerName.toLowerCase().includes(q);
      const matchEmail = ticket.customerEmail.toLowerCase().includes(q);
      const matchNum = ticket.ticketNumber.toLowerCase().includes(q);
      if (!matchSub && !matchName && !matchEmail && !matchNum) return false;
    }
    return true;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "escalated":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/30">
            <Flame className="w-3 h-3 text-rose-400 animate-pulse" /> Escalated
          </span>
        );
      case "open":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" /> Open
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/30">
            <RefreshCw className="w-3 h-3 text-sky-400" /> In Progress
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Resolved
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/30">
            Closed
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case "urgent":
        return <span className="text-xs font-bold text-rose-400">⚡ Urgent</span>;
      case "high":
        return <span className="text-xs font-semibold text-amber-400">High</span>;
      case "medium":
        return <span className="text-xs font-medium text-slate-300">Medium</span>;
      case "low":
        return <span className="text-xs font-normal text-slate-400">Low</span>;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "frustrated":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
            😠 Frustrated
          </span>
        );
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">
            🔥 Critical
          </span>
        );
      case "positive":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            😊 Satisfied
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
            😐 Neutral
          </span>
        );
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950">
      {/* 1. LEFT COLUMN: TICKET QUEUE & FILTERING */}
      <div className="w-80 md:w-96 flex flex-col border-r border-slate-800 bg-slate-900/60 shrink-0">
        {/* Search & Top Action */}
        <div className="p-3 border-b border-slate-800/80 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets, subject, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-slate-950/80 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {["all", "escalated", "open", "in_progress", "resolved"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-all ${
                  statusFilter === st
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No tickets matching filter</div>
          ) : (
            filteredTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-3.5 cursor-pointer transition-all border-l-4 ${
                    isSelected
                      ? "bg-slate-800/90 border-l-emerald-500 shadow-inner"
                      : "border-l-transparent hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] font-semibold text-slate-400">
                      {t.ticketNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(t.status)}
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-100 line-clamp-1 mb-1">
                    {t.subject}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                      <span className="font-medium text-slate-300 truncate">{t.customerName}</span>
                    </div>
                    <div>{getPriorityBadge(t.priority)}</div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40">
                    <div>{getSentimentBadge(t.sentiment)}</div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. MIDDLE COLUMN: TICKET TIMELINE & REPLY CONSOLE */}
      {selectedTicket ? (
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/40 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-emerald-400">{selectedTicket.ticketNumber}</span>
                <span className="text-slate-600">•</span>
                <h2 className="text-sm font-semibold text-white truncate max-w-md">{selectedTicket.subject}</h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Customer: <strong className="text-slate-200">{selectedTicket.customerName}</strong> ({selectedTicket.customerEmail})</span>
                <span className="text-slate-600">•</span>
                <span className="capitalize">Category: <strong className="text-slate-200">{selectedTicket.category}</strong></span>
              </div>
            </div>

            {/* Quick Actions Dropdowns */}
            <div className="flex items-center gap-2.5">
              {/* Status Select */}
              <select
                value={selectedTicket.status}
                onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="open">Status: Open</option>
                <option value="in_progress">Status: In Progress</option>
                <option value="escalated">Status: Escalated ⚡</option>
                <option value="resolved">Status: Resolved ✅</option>
                <option value="closed">Status: Closed</option>
              </select>

              {/* Priority Select */}
              <select
                value={selectedTicket.priority}
                onChange={(e) => handleUpdatePriority(e.target.value as TicketPriority)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="low">Priority: Low</option>
                <option value="medium">Priority: Medium</option>
                <option value="high">Priority: High</option>
                <option value="urgent">Priority: Urgent ⚡</option>
              </select>

              {/* Assignee Select */}
              <select
                value={selectedTicket.assignedAgent || ""}
                onChange={(e) => handleAssignAgent(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Unassigned</option>
                {AGENTS.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.role})
                  </option>
                ))}
              </select>

              {/* One-click Escalation / Resolve */}
              {selectedTicket.status !== "escalated" ? (
                <button
                  onClick={() => handleUpdateStatus("escalated")}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all"
                  title="Escalate ticket to engineering/senior tier"
                >
                  <Flame className="w-3.5 h-3.5" /> Escalate
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus("resolved")}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                </button>
              )}
            </div>
          </div>

          {/* Messages Timeline */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedTicket.messages.map((m) => {
              if (m.sender === "system") {
                return (
                  <div key={m.id} className="flex justify-center my-3">
                    <div className="rounded-full bg-slate-900/90 border border-slate-800 px-3 py-1 text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {m.text}
                      <span className="text-slate-600">({new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                    </div>
                  </div>
                );
              }

              if (m.isInternalNote) {
                return (
                  <div key={m.id} className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 max-w-2xl mx-auto my-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-amber-300">
                          INTERNAL NOTE (Private — Only Support Team Can See)
                        </span>
                        <span className="text-[11px] text-amber-400/70 font-medium">by {m.senderName}</span>
                      </div>
                      <span className="text-[10px] text-amber-400/60 font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-amber-200 leading-relaxed font-sans">{m.text}</p>
                  </div>
                );
              }

              const isCustomer = m.sender === "customer";
              const isAi = m.sender === "ai";
              const isAgent = m.sender === "agent";

              return (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-2xl ${
                    isAgent ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Avatar */}
                  <div className="shrink-0 mt-1">
                    {isCustomer ? (
                      <div className="h-8 w-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-200">
                        {m.senderName?.[0] || "C"}
                      </div>
                    ) : isAi ? (
                      <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <Bot className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-200 text-xs font-bold">
                        {m.senderName?.[0] || "A"}
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl p-4 shadow-sm border ${
                      isAgent
                        ? "bg-emerald-950/40 border-emerald-800/40 text-slate-100"
                        : isAi
                        ? "bg-slate-900 border-emerald-500/30 text-slate-200"
                        : "bg-slate-900/90 border-slate-800 text-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className={`text-[11px] font-bold ${
                        isAi ? "text-emerald-400 flex items-center gap-1" : isAgent ? "text-cyan-300" : "text-indigo-300"
                      }`}>
                        {m.senderName || (isAi ? "OmniSupport AI" : isCustomer ? "Customer" : "Agent")}
                        {isAi && <Sparkles className="w-3 h-3" />}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed whitespace-pre-line">{m.text}</p>

                    {/* AI Suggested action chips */}
                    {m.suggestedActions && m.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                        <span className="text-[10px] text-slate-400 font-medium mr-1 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3 text-amber-400" /> Suggestions:
                        </span>
                        {m.suggestedActions.map((action, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-medium"
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Box Composer */}
          <div className="border-t border-slate-800 bg-slate-900/70 p-4">
            {/* Mode switch */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInternalNote(false)}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-all ${
                    !isInternalNote
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Public Customer Reply
                </button>
                <button
                  type="button"
                  onClick={() => setIsInternalNote(true)}
                  className={`text-xs px-3 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
                    isInternalNote
                      ? "bg-amber-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Lock className="w-3 h-3" /> Internal Team Note
                </button>
              </div>

              {copilotDraft && (
                <button
                  type="button"
                  onClick={() => {
                    setReplyText(copilotDraft);
                    setIsInternalNote(false);
                  }}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  <CornerDownRight className="w-3 h-3" /> Insert Copilot Draft
                </button>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="space-y-2">
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isInternalNote
                    ? "Write an internal note (visible only to team agents)..."
                    : "Write a public reply to the customer (Ctrl+Enter to send)..."
                }
                className={`w-full rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none resize-none transition-colors border ${
                  isInternalNote
                    ? "bg-amber-950/20 border-amber-600/40 focus:border-amber-500"
                    : "bg-slate-950 border-slate-800 focus:border-emerald-500"
                }`}
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Tip: Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[9px] text-slate-300">Ctrl+Enter</kbd> to send
                </span>

                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-40 ${
                    isInternalNote
                      ? "bg-amber-600 hover:bg-amber-500"
                      : "bg-emerald-600 hover:bg-emerald-500"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? "Sending..." : isInternalNote ? "Save Internal Note" : "Send Reply"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
          Select a ticket from the queue
        </div>
      )}

      {/* 3. RIGHT COLUMN: AI COPILOT & CUSTOMER INSIGHTS */}
      {selectedTicket && (
        <div className="w-72 lg:w-80 border-l border-slate-800 bg-slate-900/40 p-4 overflow-y-auto space-y-4 shrink-0">
          {/* AI Copilot Card */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white">AI Agent Copilot</h3>
              </div>
              <button
                onClick={handleGenerateCopilot}
                disabled={copilotLoading}
                className="text-[11px] rounded bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 px-2 py-0.5 font-medium border border-emerald-500/30 transition-all flex items-center gap-1"
              >
                {copilotLoading ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {copilotDraft ? "Regenerate" : "Draft Reply"}
              </button>
            </div>

            {copilotSummary ? (
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-emerald-400 mb-1">AI Executive Summary:</p>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  {copilotSummary}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mb-3">
                Click Draft Reply to generate an instant context-aware response & ticket summary.
              </p>
            )}

            {copilotDraft && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-400">Suggested Draft:</span>
                  <button
                    onClick={() => {
                      setReplyText(copilotDraft);
                      setIsInternalNote(false);
                    }}
                    className="text-[10px] text-emerald-400 hover:underline font-bold"
                  >
                    Copy to Reply Box
                  </button>
                </div>
                <div className="text-xs text-slate-200 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 font-sans leading-relaxed">
                  {copilotDraft}
                </div>
              </div>
            )}

            {copilotActionPoints.length > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-500/20">
                <p className="text-[11px] font-semibold text-emerald-400 mb-1.5">Action Checklist:</p>
                <ul className="space-y-1">
                  {copilotActionPoints.map((action, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-emerald-500">✓</span> {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Customer Intel Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" /> Customer Profile
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="text-slate-200 font-medium">{selectedTicket.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-300 truncate max-w-[150px]">{selectedTicket.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sentiment:</span>
                <span>{getSentimentBadge(selectedTicket.sentiment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="text-slate-200 capitalize font-medium">{selectedTicket.category}</span>
              </div>
              {selectedTicket.satisfactionScore && (
                <div className="flex justify-between">
                  <span className="text-slate-500">CSAT Score:</span>
                  <span className="text-amber-400 font-bold">★ {selectedTicket.satisfactionScore}/5</span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Agent Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Assigned Specialist
            </h4>
            {selectedTicket.assignedAgent ? (
              <div className="text-xs">
                <p className="font-semibold text-slate-200">{selectedTicket.assignedAgentName}</p>
                <p className="text-slate-400 text-[11px]">
                  {AGENTS.find(a => a.id === selectedTicket.assignedAgent)?.role || "Support Specialist"}
                </p>
              </div>
            ) : (
              <p className="text-xs text-amber-400 font-medium">Currently Unassigned (Queued)</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
