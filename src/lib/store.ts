import { prisma } from "./prisma";
import { Ticket, ChatMessage, Agent, SupportMetrics, TicketStatus, TicketPriority, TicketCategory, SentimentType, MessageSender } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { INITIAL_AGENTS, seedDatabaseIfNeeded } from "./seed";

export const AGENTS: Agent[] = INITIAL_AGENTS as Agent[];

function formatTicket(row: any): Ticket {
  let tags: string[] = [];
  try {
    tags = typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags || [];
  } catch {
    tags = [];
  }

  const messages: ChatMessage[] = (row.messages || []).map((m: any) => {
    let suggestedActions: string[] | undefined;
    if (m.suggestedActions) {
      try {
        suggestedActions = typeof m.suggestedActions === "string" ? JSON.parse(m.suggestedActions) : m.suggestedActions;
      } catch {
        suggestedActions = undefined;
      }
    }
    return {
      id: m.id,
      ticketId: m.ticketId,
      sender: m.sender as MessageSender,
      senderName: m.senderName,
      text: m.text,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
      isInternalNote: Boolean(m.isInternalNote),
      suggestedActions,
    };
  });

  return {
    id: row.id,
    ticketNumber: row.ticketNumber,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerAvatar: row.customerAvatar,
    subject: row.subject,
    status: row.status as TicketStatus,
    priority: row.priority as TicketPriority,
    category: row.category as TicketCategory,
    sentiment: row.sentiment as SentimentType,
    assignedAgent: row.assignedAgent || undefined,
    assignedAgentName: row.assignedAgentName || undefined,
    satisfactionScore: row.satisfactionScore ?? undefined,
    aiSummary: row.aiSummary || undefined,
    tags,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    messages,
  };
}

class DatabaseSupportStore {
  async getTickets(): Promise<Ticket[]> {
    await seedDatabaseIfNeeded();
    const rows = await prisma.ticket.findMany({
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(formatTicket);
  }

  async getTicketById(id: string): Promise<Ticket | null> {
    await seedDatabaseIfNeeded();
    const row = await prisma.ticket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }],
      },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
    });
    return row ? formatTicket(row) : null;
  }

  async createTicket(data: Partial<Ticket>): Promise<Ticket> {
    await seedDatabaseIfNeeded();
    const count = await prisma.ticket.count();
    const nextNum = count + 101;
    const ticketId = data.id || `tkt-${uuidv4().substring(0, 8)}`;
    const ticketNum = data.ticketNumber || `TK-${nextNum}`;

    const newRow = await prisma.ticket.create({
      data: {
        id: ticketId,
        ticketNumber: ticketNum,
        customerName: data.customerName || "Anonymous Customer",
        customerEmail: data.customerEmail || "customer@example.com",
        customerAvatar: data.customerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.customerName || "customer"}`,
        subject: data.subject || "Support Inquiry",
        status: data.status || "open",
        priority: data.priority || "medium",
        category: data.category || "general",
        sentiment: data.sentiment || "neutral",
        assignedAgent: data.assignedAgent,
        assignedAgentName: data.assignedAgentName,
        aiSummary: data.aiSummary,
        tags: JSON.stringify(data.tags || ["web-chat"]),
      },
      include: {
        messages: true,
      },
    });

    return formatTicket(newRow);
  }

  async addMessage(
    ticketId: string,
    message: Omit<ChatMessage, "id" | "ticketId" | "timestamp">
  ): Promise<{ ticket: Ticket; message: ChatMessage } | null> {
    await seedDatabaseIfNeeded();
    const existing = await this.getTicketById(ticketId);
    if (!existing) return null;

    const messageId = `msg-${uuidv4().substring(0, 8)}`;
    const actionsJson = message.suggestedActions ? JSON.stringify(message.suggestedActions) : null;

    const createdMsg = await prisma.chatMessage.create({
      data: {
        id: messageId,
        ticketId: existing.id,
        sender: message.sender,
        senderName: message.senderName || (message.sender === "customer" ? existing.customerName : "Agent"),
        text: message.text,
        isInternalNote: Boolean(message.isInternalNote),
        suggestedActions: actionsJson,
      },
    });

    await prisma.ticket.update({
      where: { id: existing.id },
      data: { updatedAt: new Date() },
    });

    const updatedTicket = await this.getTicketById(existing.id);
    if (!updatedTicket) return null;

    const formattedMessage: ChatMessage = {
      id: createdMsg.id,
      ticketId: createdMsg.ticketId,
      sender: createdMsg.sender as MessageSender,
      senderName: createdMsg.senderName,
      text: createdMsg.text,
      timestamp: createdMsg.timestamp.toISOString(),
      isInternalNote: createdMsg.isInternalNote,
      suggestedActions: message.suggestedActions,
    };

    return { ticket: updatedTicket, message: formattedMessage };
  }

  async updateTicket(
    ticketId: string,
    updates: Partial<Pick<Ticket, "status" | "priority" | "category" | "sentiment" | "assignedAgent" | "assignedAgentName" | "aiSummary" | "satisfactionScore" | "tags">>
  ): Promise<Ticket | null> {
    await seedDatabaseIfNeeded();
    const existing = await this.getTicketById(ticketId);
    if (!existing) return null;

    let assignedAgentName = updates.assignedAgentName;
    if (updates.assignedAgent && !assignedAgentName) {
      const agent = AGENTS.find((a) => a.id === updates.assignedAgent);
      if (agent) assignedAgentName = agent.name;
    }

    const dataToUpdate: any = {};
    if (updates.status !== undefined) dataToUpdate.status = updates.status;
    if (updates.priority !== undefined) dataToUpdate.priority = updates.priority;
    if (updates.category !== undefined) dataToUpdate.category = updates.category;
    if (updates.sentiment !== undefined) dataToUpdate.sentiment = updates.sentiment;
    if (updates.assignedAgent !== undefined) dataToUpdate.assignedAgent = updates.assignedAgent;
    if (assignedAgentName !== undefined) dataToUpdate.assignedAgentName = assignedAgentName;
    if (updates.aiSummary !== undefined) dataToUpdate.aiSummary = updates.aiSummary;
    if (updates.satisfactionScore !== undefined) dataToUpdate.satisfactionScore = updates.satisfactionScore;
    if (updates.tags !== undefined) dataToUpdate.tags = JSON.stringify(updates.tags);

    const updated = await prisma.ticket.update({
      where: { id: existing.id },
      data: dataToUpdate,
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    return formatTicket(updated);
  }

  async getMetrics(): Promise<SupportMetrics> {
    await seedDatabaseIfNeeded();
    const tickets = await prisma.ticket.findMany();

    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "open").length;
    const escalated = tickets.filter((t) => t.status === "escalated").length;
    const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

    const ratedTickets = tickets.filter((t) => t.satisfactionScore !== null && t.satisfactionScore !== undefined);
    const csatAverage = ratedTickets.length > 0
      ? Number((ratedTickets.reduce((acc, t) => acc + (t.satisfactionScore || 0), 0) / ratedTickets.length).toFixed(1))
      : 4.8;

    const sentimentBreakdown = {
      positive: tickets.filter((t) => t.sentiment === "positive").length,
      neutral: tickets.filter((t) => t.sentiment === "neutral").length,
      frustrated: tickets.filter((t) => t.sentiment === "frustrated").length,
      urgent: tickets.filter((t) => t.sentiment === "urgent").length,
    };

    const categoryBreakdown = {
      billing: tickets.filter((t) => t.category === "billing").length,
      technical: tickets.filter((t) => t.category === "technical").length,
      account: tickets.filter((t) => t.category === "account").length,
      general: tickets.filter((t) => t.category === "general").length,
    };

    return {
      totalTickets: total,
      openTickets: open,
      escalatedTickets: escalated,
      resolvedTickets: resolved,
      avgResolutionTimeHours: 2.4,
      csatAverage,
      sentimentBreakdown,
      categoryBreakdown,
    };
  }
}

export const store = new DatabaseSupportStore();
