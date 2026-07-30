import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getState, setState, insertTippedRequest, ShowId } from "../../../lib/state";

export const dynamic = "force-dynamic";

function isShowId(value: string): value is ShowId {
  return value === "midnight-something-special" || value === "hooks-harmony";
}

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
    const showRaw = meta.show || "midnight-something-special";
    const show: ShowId = isShowId(showRaw) ? showRaw : "midnight-something-special";
    const title = meta.title || "";
    const artist = meta.artist || "";
    const name = meta.name || "";
    const message = meta.message || "";
    const tipCents = Number(meta.tipCents || 0);
    if (title && artist) {
      const state = await getState(show);
      state.queue = insertTippedRequest(state.queue, {
        title,
        artist,
        name: name || undefined,
        message: message || undefined,
        ts: Date.now(),
        tipped: true,
        tipCents,
      });
      await setState(show, state);
    }
  }
  return NextResponse.json({ received: true });
}
