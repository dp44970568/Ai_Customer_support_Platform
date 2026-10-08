"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AgentDashboard } from "@/components/AgentDashboard";
import { CustomerChatWidget } from "@/components/CustomerChatWidget";
import { KnowledgeBaseView } from "@/components/KnowledgeBaseView";
import { AnalyticsView } from "@/components/AnalyticsView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"agent" | "customer" | "knowledge" | "analytics">("agent");
  const [escalatedCount, setEscalatedCount] = useState(0);

  const fetchEscalatedCount = async () => {
    try {
      const res = await fetch("/api/tickets?status=escalated");
      if (res.ok) {
        const data = await res.json();
        setEscalatedCount(data.tickets?.length || 0);
      }
    } catch (e) {
      console.error("Failed to check escalated count:", e);
    }
  };

  useEffect(() => {
    fetchEscalatedCount();
    const interval = setInterval(fetchEscalatedCount, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        escalatedCount={escalatedCount}
      />

      <main className="flex-1 overflow-hidden">
        {activeTab === "agent" && (
          <AgentDashboard onRefreshMetrics={fetchEscalatedCount} />
        )}
        {activeTab === "customer" && (
          <CustomerChatWidget onTicketUpdated={fetchEscalatedCount} />
        )}
        {activeTab === "knowledge" && (
          <KnowledgeBaseView />
        )}
        {activeTab === "analytics" && (
          <AnalyticsView />
        )}
      </main>
    </div>
  );
}
