import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// Public endpoint: a one-time "support the show" gift. No perks, no queue
// spot, and no giveaway entries. Just love. The amount is checked on the
// server so nobody can send a broken value.

const MIN_CENTS = 100; // $1
const MAX_CENTS = 50000; // $500

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 500 });
  }
  const stripe = new Stripe(secretKey);

  const body = await req.json();
  const amountCents = Math.round(Number(body.amount) * 100);
  const name = (body.name || "").toString().slice(0, 60);
  if (!amountCents || amountCents < MIN_CENTS || amountCents > MAX_CENTS) {
    return NextResponse.json({ error: "Enter an amount between $1 and $500." }, { status: 400 });
  }

  const origin = req.headers.get("origin") || "https://jackieespada.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "One-Time Gift to the Show" },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: { kind: "one-time-gift", name, amountCents: String(amountCents) },
      success_url: `${origin}/?gift=1#supporter`,
      cancel_url: `${origin}/#supporter`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Couldn't start checkout. Try again in a moment." }, { status: 500 });
  }
}
