import { NextResponse } from "next/server";
import { store, AGENTS } from "@/lib/store";
import { processCustomerMessage } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, customerName, customerEmail, message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    let ticket = ticketId ? await store.getTicketById(ticketId) : null;

    // If no existing ticket, create one
    if (!ticket) {
      ticket = await store.createTicket({
        customerName: customerName || "Guest User",
        customerEmail: customerEmail || "guest@user.io",
        subject: message.length > 50 ? `${message.substring(0, 47)}...` : message,
        status: "open",
        priority: "medium",
        category: "general",
      });
    }

    // Add user message to ticket
    await store.addMessage(ticket.id, {
      sender: "customer",
      senderName: ticket.customerName,
      text: message,
    });

    // Form history for AI context
    const currentTicket = await store.getTicketById(ticket.id);
    const conversationHistory = (currentTicket?.messages || []).map(m => ({
      sender: m.sender,
      text: m.text,
    }));

    // Process with AI & Knowledge Base RAG
    const aiResult = await processCustomerMessage(message, conversationHistory);

    // If escalation triggered
    let updatedStatus = ticket.status;
    let assignedAgent = ticket.assignedAgent;
    let assignedAgentName = ticket.assignedAgentName;

    if (aiResult.shouldEscalate && ticket.status !== "escalated" && ticket.status !== "resolved") {
      updatedStatus = "escalated";
      const onlineAgent = AGENTS.find(a => a.isOnline) || AGENTS[0];
      assignedAgent = onlineAgent.id;
      assignedAgentName = onlineAgent.name;

      await store.addMessage(ticket.id, {
        sender: "system",
        senderName: "System",
        text: `Automated escalation triggered. Assigned to ${assignedAgentName}. Priority adjusted to ${aiResult.priority.toUpperCase()}.`,
      });
    }

    // Update ticket metadata
    await store.updateTicket(ticket.id, {
      status: updatedStatus,
      priority: aiResult.priority,
      category: aiResult.category,
      sentiment: aiResult.sentiment,
      assignedAgent,
      assignedAgentName,
    });

    // Add AI message to ticket
    const aiMessageResult = await store.addMessage(ticket.id, {
      sender: "ai",
      senderName: "OmniSupport AI",
      text: aiResult.reply,
      suggestedActions: aiResult.suggestedActions,
    });

    const finalTicket = await store.getTicketById(ticket.id);

    return NextResponse.json({
      ticket: finalTicket,
      replyMessage: aiMessageResult?.message,
      analysis: {
        sentiment: aiResult.sentiment,
        category: aiResult.category,
        priority: aiResult.priority,
        shouldEscalate: aiResult.shouldEscalate,
      }
    });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Failed to process message", details: err?.message }, { status: 500 });
  }
}
