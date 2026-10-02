import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// Public endpoint: anyone visiting the site can start a monthly-support
// checkout. Creates a Stripe subscription with a customer-chosen amount
// (no pre-made Stripe Price needed) and tags it with metadata so the
// webhook knows to add this person to the supporter wall once payment
// succeeds.

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 500 });
  }
  const stripe = new Stripe(secretKey);

  const body = await req.json();
  const amountDollars = Number(body.amount);
  const name = (body.name || "").toString().slice(0, 60);
  const message = (body.message || "").toString().slice(0, 300);

  if (!amountDollars || amountDollars < 1) {
    return NextResponse.json({ error: "Enter an amount of at least $1." }, { status: 400 });
  }

  const amountCents = Math.round(amountDollars * 100);
  const origin = req.headers.get("origin") || "https://jackieespada.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Monthly Supporter" },
            recurring: { interval: "month" },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: "monthly-supporter",
        name,
        message,
        amountCents: String(amountCents),
      },
      success_url: `${origin}/?supported=1`,
      cancel_url: `${origin}/?supported=0`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Couldn't start checkout. Try again in a moment." }, { status: 500 });
  }
}
