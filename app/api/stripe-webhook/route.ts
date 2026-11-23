import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getState, setState, insertTippedRequest, ShowId } from "../../../lib/state";
import { makeId } from "../../../lib/api-handlers";
import { getSiteState, setSiteState, makeSiteId } from "../../../lib/site-state";

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

    if (meta.kind === "monthly-supporter") {
      const siteState = await getSiteState();
      siteState.supporters.push({
        id: makeSiteId(),
        name: meta.name || undefined,
        message: meta.message || undefined,
        amountCents: Number(meta.amountCents || 0),
        ts: Date.now(),
      });
      await setSiteState(siteState);
    } else {
      const showId: ShowId = meta.show === "hooks-harmony" ? "hooks-harmony" : "midnight-something-special";
      const title = meta.title || "";
      const artist = meta.artist || "";
      const name = meta.name || "";
      const message = meta.message || "";
      const videoUrl = meta.videoUrl || "";
      const tipCents = Number(meta.tipCents || 0);
      const topUpId = meta.topUpId || "";

      if (title && artist) {
        const state = await getState(showId);

        // A top-up adds to a song that is already in the queue and moves it
        // up to where its new total belongs. If that song has already been
        // played (or removed) by the time the payment lands, it falls through
        // and gets added as a fresh tipped request instead.
        const existingIndex = topUpId ? state.queue.findIndex((r) => r.id === topUpId) : -1;

        if (existingIndex !== -1) {
          const existing = state.queue.splice(existingIndex, 1)[0];
          existing.tipped = true;
          existing.tipCents = (existing.tipCents || 0) + tipCents;
          state.queue = insertTippedRequest(state.queue, existing);
        } else {
          state.queue = insertTippedRequest(state.queue, {
            id: makeId(),
            title,
            artist,
            name: name || undefined,
            message: message || undefined,
            videoUrl: videoUrl || undefined,
            ts: Date.now(),
            tipped: true,
            tipCents,
          });
        }
        await setState(showId, state);
      }
    }
  }

  return NextResponse.json({ received: true });
}
