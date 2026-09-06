import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo-mode";

export function GET() {
  return NextResponse.json({ demo: isDemoMode }, { headers: { "Cache-Control": "no-store" } });
}
