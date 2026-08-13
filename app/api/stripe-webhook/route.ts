import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getState, setState, insertTippedRequest } from "../../../lib/state";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 500 });
  }
  const stripe = new Stripe(secretKey);

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature || "", webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};
    const title = meta.title || "";
    const artist = meta.artist || "";
    const name = meta.name || "";
    const message = meta.message || "";
    const tipCents = Number(meta.tipCents || 0);

    if (title && artist) {
      const state = await getState();
      state.queue = insertTippedRequest(state.queue, {
        title,
        artist,
        name: name || undefined,
        message: message || undefined,
        ts: Date.now(),
        tipped: true,
        tipCents,
      });
      await setState(state);
    }
  }

  return NextResponse.json({ received: true });
}
