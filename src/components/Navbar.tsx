"use client";

import React from "react";
import { 
  Bot, 
  LifeBuoy, 
  BookOpen, 
  BarChart3, 
  MessageSquareText, 
  Sparkles,
  Users
} from "lucide-react";

interface NavbarProps {
  activeTab: "agent" | "customer" | "knowledge" | "analytics";
  setActiveTab: (tab: "agent" | "customer" | "knowledge" | "analytics") => void;
  escalatedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, escalatedCount }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-md shadow-emerald-500/20">
            <Bot className="h-6 w-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">OmniSupport</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Platform
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Support & Escalation Hub</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1 rounded-xl bg-slate-950/60 p-1 border border-slate-800/80">
          <button
            onClick={() => setActiveTab("agent")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "agent"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <LifeBuoy className="h-4 w-4 text-emerald-400" />
            <span>Agent Desk</span>
            {escalatedCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white animate-pulse">
                {escalatedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("customer")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "customer"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <MessageSquareText className="h-4 w-4 text-cyan-400" />
            <span>Customer Live Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("knowledge")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "knowledge"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <BookOpen className="h-4 w-4 text-amber-400" />
            <span>Knowledge Base (RAG)</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "analytics"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <BarChart3 className="h-4 w-4 text-purple-400" />
            <span>Analytics & CSAT</span>
          </button>
        </nav>

        {/* Live System Status Indicator */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-1.5 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">AI Copilot & RAG Active</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 border border-slate-800/80 rounded-lg px-2.5 py-1.5 bg-slate-950/40">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>3 Agents Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};
