"use client";

import React, { useState, useEffect } from "react";
import { SupportMetrics } from "@/types";
import { 
  BarChart3, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Star, 
  Smile, 
  Meh, 
  Frown, 
  AlertOctagon, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  RefreshCw
} from "lucide-react";

export const AnalyticsView: React.FC = () => {
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error("Error fetching metrics:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 text-xs text-slate-500">
        Loading analytics & performance telemetry...
      </div>
    );
  }

  const aiAutonomousCount = metrics.totalTickets - metrics.escalatedTickets;
  const aiAutonomousRate = metrics.totalTickets > 0 
    ? Math.round((aiAutonomousCount / metrics.totalTickets) * 100) 
    : 75;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-slate-950 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" /> Platform Telemetry & CSAT
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Live operational metrics, AI deflection rate, sentiment analysis, and agent resolution times.
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            className="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* 4 Core KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total Tickets Handled</span>
              <BarChart3 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{metrics.totalTickets}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
              <TrendingUp className="w-3 h-3" /> 100% telemetry synced
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">AI Deflection Rate</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{aiAutonomousRate}%</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {aiAutonomousCount} resolved without human intervention
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Escalated to Humans</span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400">{metrics.escalatedTickets}</div>
            <div className="text-[11px] text-rose-400/80 mt-1 font-medium">
              Routing directly to tier-1 specialists
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Customer CSAT</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 flex items-center gap-1">
              {metrics.csatAverage} <span className="text-sm font-normal text-slate-400">/ 5.0</span>
            </div>
            <div className="text-[11px] text-amber-400/80 mt-1 font-medium">
              ★ ★ ★ ★ ★ High satisfaction score
            </div>
          </div>
        </div>

        {/* 2 Detailed Breakdowns: Sentiment & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Sentiment Telemetry */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span>Sentiment Breakdown</span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                Real-time AI classified
              </span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <Smile className="w-4 h-4" /> Positive / Delighted
                  </span>
                  <span className="font-bold text-slate-200">{metrics.sentimentBreakdown.positive}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(metrics.sentimentBreakdown.positive / Math.max(metrics.totalTickets, 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Meh className="w-4 h-4" /> Neutral / Informational
                  </span>
                  <span className="font-bold text-slate-200">{metrics.sentimentBreakdown.neutral}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full"
                    style={{ width: `${(metrics.sentimentBreakdown.neutral / Math.max(metrics.totalTickets, 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <Frown className="w-4 h-4" /> Frustrated
                  </span>
                  <span className="font-bold text-slate-200">{metrics.sentimentBreakdown.frustrated}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(metrics.sentimentBreakdown.frustrated / Math.max(metrics.totalTickets, 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                    <AlertOctagon className="w-4 h-4" /> Urgent / Critical Priority
                  </span>
                  <span className="font-bold text-slate-200">{metrics.sentimentBreakdown.urgent}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(metrics.sentimentBreakdown.urgent / Math.max(metrics.totalTickets, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Category Distribution */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Inquiry Category Distribution</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-cyan-400 font-medium">Technical & API (Webhooks, SLA, Errors)</span>
                  <span className="font-bold text-slate-200">{metrics.categoryBreakdown.technical}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${(metrics.categoryBreakdown.technical / Math.max(metrics.totalTickets, 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-indigo-400 font-medium">Billing & Invoicing (Refunds, Renewals)</span>
                  <span className="font-bold text-slate-200">{metrics.categoryBreakdown.billing}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(metrics.categoryBreakdown.billing / Math.max(metrics.totalTickets, 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-amber-400 font-medium">Account & Security (SSO, 2FA, Seats)</span>
                  <span className="font-bold text-slate-200">{metrics.categoryBreakdown.account}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(metrics.categoryBreakdown.account / Math.max(metrics.totalTickets, 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">General Inquiries</span>
                  <span className="font-bold text-slate-200">{metrics.categoryBreakdown.general}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-600 rounded-full"
                    style={{ width: `${(metrics.categoryBreakdown.general / Math.max(metrics.totalTickets, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
