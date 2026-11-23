import { NextResponse } from "next/server";
import { getVipStatus } from "@/lib/vip";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const status = await getVipStatus((body.email || "").toString());
  return NextResponse.json(status, { status: status.ok ? 200 : 400 });
}
