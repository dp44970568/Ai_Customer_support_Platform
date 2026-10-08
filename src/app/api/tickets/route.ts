import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { TicketCategory, TicketPriority, TicketStatus } from "@/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as TicketStatus | null;
  const category = searchParams.get("category") as TicketCategory | null;
  const priority = searchParams.get("priority") as TicketPriority | null;
  const search = searchParams.get("q")?.toLowerCase();

  let tickets = await store.getTickets();

  if (status && status !== ("all" as any)) {
    tickets = tickets.filter(t => t.status === status);
  }

  if (category && category !== ("all" as any)) {
    tickets = tickets.filter(t => t.category === category);
  }

  if (priority && priority !== ("all" as any)) {
    tickets = tickets.filter(t => t.priority === priority);
  }

  if (search) {
    tickets = tickets.filter(
      t =>
        t.subject.toLowerCase().includes(search) ||
        t.customerName.toLowerCase().includes(search) ||
        t.customerEmail.toLowerCase().includes(search) ||
        t.ticketNumber.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newTicket = await store.createTicket(body);
    return NextResponse.json({ ticket: newTicket }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create ticket", details: err?.message }, { status: 500 });
  }
}
