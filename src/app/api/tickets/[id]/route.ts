import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ticket = await store.getTicketById(params.id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  return NextResponse.json({ ticket });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await store.updateTicket(params.id, body);

    if (!updated) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // If status changed, post a system note in the timeline
    if (body.status) {
      await store.addMessage(params.id, {
        sender: "system",
        senderName: "System",
        text: `Status changed to ${body.status.toUpperCase()}${body.assignedAgentName ? ` (Assigned to ${body.assignedAgentName})` : ""}`,
      });
    }

    const refreshed = await store.getTicketById(params.id);
    return NextResponse.json({ ticket: refreshed || updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update ticket", details: err?.message }, { status: 500 });
  }
}
