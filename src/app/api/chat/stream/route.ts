import { store, AGENTS } from "@/lib/store";
import { processCustomerMessageStream } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, customerName, customerEmail, message } = body;

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message content is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let ticket = ticketId ? await store.getTicketById(ticketId) : null;

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

    // Add user message to ticket in SQLite
    await store.addMessage(ticket.id, {
      sender: "customer",
      senderName: ticket.customerName,
      text: message,
    });

    const currentTicket = await store.getTicketById(ticket.id);
    const conversationHistory = (currentTicket?.messages || []).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    const encoder = new TextEncoder();
    const ticketIdToUse = ticket.id;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const streamGen = processCustomerMessageStream(message, conversationHistory);
          let fullReply = "";
          let finalAnalysisResult: any = null;

          for await (const chunk of streamGen) {
            if (chunk.type === "token") {
              fullReply += chunk.text;
              const payload = JSON.stringify({ type: "token", text: chunk.text });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            } else if (chunk.type === "done") {
              finalAnalysisResult = chunk.result;
            }
          }

          if (finalAnalysisResult) {
            const currentT = await store.getTicketById(ticketIdToUse);
            let updatedStatus = currentT?.status || "open";
            let assignedAgent = currentT?.assignedAgent;
            let assignedAgentName = currentT?.assignedAgentName;

            if (
              finalAnalysisResult.shouldEscalate &&
              updatedStatus !== "escalated" &&
              updatedStatus !== "resolved"
            ) {
              updatedStatus = "escalated";
              const onlineAgent = AGENTS.find((a) => a.isOnline) || AGENTS[0];
              assignedAgent = onlineAgent.id;
              assignedAgentName = onlineAgent.name;

              await store.addMessage(ticketIdToUse, {
                sender: "system",
                senderName: "System",
                text: `Automated escalation triggered. Assigned to ${assignedAgentName}. Priority adjusted to ${finalAnalysisResult.priority.toUpperCase()}.`,
              });
            }

            await store.updateTicket(ticketIdToUse, {
              status: updatedStatus,
              priority: finalAnalysisResult.priority,
              category: finalAnalysisResult.category,
              sentiment: finalAnalysisResult.sentiment,
              assignedAgent,
              assignedAgentName,
            });

            const aiMsgResult = await store.addMessage(ticketIdToUse, {
              sender: "ai",
              senderName: "OmniSupport AI",
              text: finalAnalysisResult.reply,
              suggestedActions: finalAnalysisResult.suggestedActions,
            });

            const refreshedTicket = await store.getTicketById(ticketIdToUse);

            const donePayload = JSON.stringify({
              type: "done",
              ticket: refreshedTicket,
              replyMessage: aiMsgResult?.message,
              analysis: {
                sentiment: finalAnalysisResult.sentiment,
                category: finalAnalysisResult.category,
                priority: finalAnalysisResult.priority,
                shouldEscalate: finalAnalysisResult.shouldEscalate,
              },
            });

            controller.enqueue(encoder.encode(`data: ${donePayload}\n\n`));
          }

          controller.close();
        } catch (err: any) {
          console.error("Stream generation error:", err);
          const errorPayload = JSON.stringify({ type: "error", error: err?.message });
          controller.enqueue(encoder.encode(`data: ${errorPayload}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("Streaming chat route error:", err);
    return new Response(JSON.stringify({ error: err?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
