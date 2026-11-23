import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// Public endpoint: anyone visiting the site can start a monthly-support
// checkout. There are three fixed tiers. The tier decides the price on the
// server, so nobody can pay less by editing the page. For older callers that
// still send a custom amount instead of a tier, the old behavior is kept
// until the landing page is switched over.

const TIERS: Record<string, { cents: number; productName: string }> = {
  supporter: { cents: 500, productName: "Monthly Supporter" },
  vip: { cents: 1500, productName: "Monthly VIP" },
  producer: { cents: 3000, productName: "Monthly Producer" },
};

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 500 });
  }
  const stripe = new Stripe(secretKey);

  const body = await req.json();
  const name = (body.name || "").toString().slice(0, 60);
  const message = (body.message || "").toString().slice(0, 300);
  const tierKey = (body.tier || "").toString().trim().toLowerCase();

  let amountCents = 0;
  let productName = "Monthly Supporter";
  let tier = "custom";

  if (tierKey) {
    const chosen = TIERS[tierKey];
    if (!chosen) {
      return NextResponse.json({ error: "Pick one of the three tiers." }, { status: 400 });
    }
    amountCents = chosen.cents;
    productName = chosen.productName;
    tier = tierKey;
  } else {
    const amountDollars = Number(body.amount);
    if (!amountDollars || amountDollars < 1) {
      return NextResponse.json({ error: "Enter an amount of at least $1." }, { status: 400 });
    }
    amountCents = Math.round(amountDollars * 100);
  }

  const origin = req.headers.get("origin") || "https://jackieespada.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: productName },
            recurring: { interval: "month" },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: "monthly-supporter",
        tier,
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
