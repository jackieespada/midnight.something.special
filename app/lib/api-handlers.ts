import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ShowId, getState, setState, MAX_QUEUE, MAX_PER_PERSON } from "./state";

export function stateHandler(showId: ShowId) {
  return async function GET() {
    const state = await getState(showId);
    return NextResponse.json(state);
  };
}

export function requestHandler(showId: ShowId) {
  return async function POST(req: Request) {
    const body = await req.json();
    const title = (body.title || "").toString().trim();
    const artist = (body.artist || "").toString().trim();
    const name = (body.name || "").toString().trim();
    const message = (body.message || "").toString().trim().slice(0, 200);
    const visitorId = (body.visitorId || "").toString().trim();

    if (!title || !artist) {
      return NextResponse.json({ error: "title and artist are required" }, { status: 400 });
    }

    const state = await getState(showId);

    if (state.queue.length >= MAX_QUEUE) {
      return NextResponse.json(
        { error: "Requests are full for tonight — but you can still tip to jump the line!" },
        { status: 400 }
      );
    }

    if (visitorId) {
      const count = state.submitterCounts[visitorId] || 0;
      if (count >= MAX_PER_PERSON) {
        return NextResponse.json(
          { error: `You've already submitted ${MAX_PER_PERSON} requests tonight — tip to add more!` },
          { status: 400 }
        );
      }
      state.submitterCounts[visitorId] = count + 1;
    }

    state.queue.push({
      title,
      artist,
      name: name || undefined,
      message: message || undefined,
      ts: Date.now(),
    });
    await setState(showId, state);

    return NextResponse.json({ ok: true });
  };
}

export function manualAddHandler(showId: ShowId) {
  return async function POST(req: Request) {
    const body = await req.json();
    const title = (body.title || "").toString().trim();
    const artist = (body.artist || "").toString().trim();
    const name = (body.name || "").toString().trim();
    const message = (body.message || "").toString().trim().slice(0, 200);

    if (!title || !artist) {
      return NextResponse.json({ error: "title and artist are required" }, { status: 400 });
    }

    const state = await getState(showId);

    if (state.queue.length >= MAX_QUEUE) {
      return NextResponse.json({ error: "Queue is at the cap already." }, { status: 400 });
    }

    state.queue.push({
      title,
      artist,
      name: name || undefined,
      message: message || undefined,
      ts: Date.now(),
    });
    await setState(showId, state);

    return NextResponse.json({ ok: true });
  };
}

export function advanceHandler(showId: ShowId) {
  return async function POST() {
    const state = await getState(showId);
    const next = state.queue.shift();

    if (!next) {
      return NextResponse.json({ error: "queue is empty" }, { status: 400 });
    }

    if (state.nowPlaying?.title) {
      state.history.push({
        title: state.nowPlaying.title,
        artist: state.nowPlaying.artist,
        name: state.nowPlaying.name,
        message: state.nowPlaying.message,
        ts: Date.now(),
      });
    }

    state.lastPlayed = state.nowPlaying;
    state.nowPlaying = {
      title: next.title,
      artist: next.artist,
      name: next.name,
      message: next.message,
    };
    await setState(showId, state);

    return NextResponse.json({ ok: true, state });
  };
}

export function nowPlayingHandler(showId: ShowId) {
  return async function POST(req: Request) {
    const body = await req.json();
    const title = (body.title || "").toString().trim();
    const artist = (body.artist || "").toString().trim();

    const state = await getState(showId);
    state.nowPlaying = {
      title: title || state.nowPlaying.title,
      artist: artist || state.nowPlaying.artist,
    };
    await setState(showId, state);

    return NextResponse.json({ ok: true, state });
  };
}

export function queueBoostHandler(showId: ShowId) {
  return async function POST(req: Request) {
    const body = await req.json();
    const index = Number(body.index);

    const state = await getState(showId);

    if (Number.isNaN(index) || index < 0 || index >= state.queue.length) {
      return NextResponse.json({ error: "Invalid queue position." }, { status: 400 });
    }

    const [item] = state.queue.splice(index, 1);
    item.tipped = true;
    if (!item.tipCents) item.tipCents = 0;
    state.queue.unshift(item);

    await setState(showId, state);

    return NextResponse.json({ ok: true, state });
  };
}

export function queueReorderHandler(showId: ShowId) {
  return async function POST(req: Request) {
    const body = await req.json();
    const order = body.order;

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: "order must be an array" }, { status: 400 });
    }

    const state = await getState(showId);
    state.queue = order;
    await setState(showId, state);

    return NextResponse.json({ ok: true, state });
  };
}

export function newEpisodeHandler(showId: ShowId) {
  return async function POST() {
    const state = await getState(showId);

    if (state.history.length > 0) {
      const date = new Date().toISOString().slice(0, 10);
      state.episodes.unshift({ date, songs: state.history });
    }

    state.history = [];
    state.submitterCounts = {};
    await setState(showId, state);

    return NextResponse.json({ ok: true, state });
  };
}

export function themeHandler(showId: ShowId) {
  return async function POST(req: Request) {
    const body = await req.json();
    const theme = (body.theme || "").toString().trim().slice(0, 120);

    const state = await getState(showId);
    state.theme = theme;
    await setState(showId, state);

    return NextResponse.json({ ok: true, state });
  };
}

export function tipCheckoutHandler(showId: ShowId) {
  return async function POST(req: Request) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 500 });
    }
    const stripe = new Stripe(secretKey);

    const body = await req.json();
    const title = (body.title || "").toString().trim();
    const artist = (body.artist || "").toString().trim();
    const name = (body.name || "").toString().trim();
    const message = (body.message || "").toString().trim().slice(0, 200);
    const amount = Number(body.amount);

    if (!title || !artist) {
      return NextResponse.json({ error: "title and artist are required" }, { status: 400 });
    }
    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Enter a tip amount of at least $1." }, { status: 400 });
    }

    const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
    const amountCents = Math.round(amount * 100);
    const requestPath = showId === "hooks-harmony" ? "/hooks-harmony/request" : "/request";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Bump: ${title} — ${artist}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: { show: showId, title, artist, name, message, tipCents: String(amountCents) },
      success_url: `${origin}${requestPath}?tipped=1`,
      cancel_url: `${origin}${requestPath}?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  };
}
