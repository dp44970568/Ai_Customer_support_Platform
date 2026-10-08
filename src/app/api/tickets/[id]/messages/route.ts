import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { sender, senderName, text, isInternalNote } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    const result = await store.addMessage(params.id, {
      sender: sender || "agent",
      senderName: senderName || "Agent",
      text,
      isInternalNote: Boolean(isInternalNote),
    });

    if (!result) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // If agent sent a public reply, ensure status moves to in_progress if currently open
    if (!isInternalNote && result.ticket.status === "open") {
      await store.updateTicket(params.id, { status: "in_progress" });
    }

    const currentTicket = await store.getTicketById(params.id);

    return NextResponse.json({
      message: result.message,
      ticket: currentTicket
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to post message", details: err?.message }, { status: 500 });
  }
}
