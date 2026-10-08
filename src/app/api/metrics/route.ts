import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const metrics = await store.getMetrics();
  return NextResponse.json({ metrics });
}
