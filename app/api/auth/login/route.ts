import { NextResponse } from "next/server";

async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  const body = await req.json();
  const password = (body.password || "").toString();
  const expected = process.env.DJ_PASSWORD || "";

  if (!expected) {
    return NextResponse.json({ error: "DJ_PASSWORD is not set up yet." }, { status: 500 });
  }
  if (password !== expected) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await hashPassword(expected);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("dj_auth", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
