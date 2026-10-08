import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { generateAgentCopilotSuggestions } from "@/lib/ai";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ticket = await store.getTicketById(params.id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const copilotData = await generateAgentCopilotSuggestions(
      ticket.subject,
      ticket.category,
      ticket.messages.map(m => ({ sender: m.sender, text: m.text }))
    );

    // Save AI summary to ticket if not already set
    await store.updateTicket(ticket.id, {
      aiSummary: copilotData.summary,
    });

    return NextResponse.json({
      suggestedReply: copilotData.suggestedReply,
      summary: copilotData.summary,
      actionPoints: copilotData.actionPoints,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to generate copilot suggestions", details: err?.message }, { status: 500 });
  }
}
