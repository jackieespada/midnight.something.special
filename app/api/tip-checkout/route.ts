import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 500 });
  }
  const stripe = new Stripe(secretKey);

  const body = await req.json();
  const title = (body.title || "").toString().trim();
  const artist = (body.artist || "").toString().trim();
  const name = (body.name || "").toString().trim();
  const amount = Number(body.amount);

  if (!title || !artist) {
    return NextResponse.json({ error: "title and artist are required" }, { status: 400 });
  }
  if (!amount || amount < 1) {
    return NextResponse.json({ error: "Enter a tip amount of at least $1." }, { status: 400 });
  }

  const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
  const amountCents = Math.round(amount * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Bump: ${title} — ${artist}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { title, artist, name, tipCents: String(amountCents) },
    success_url: `${origin}/request?tipped=1`,
    cancel_url: `${origin}/request?cancelled=1`,
  });

  return NextResponse.json({ url: session.url });
}
