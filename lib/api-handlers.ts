import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ShowId, getState, setState, MAX_QUEUE, MAX_PER_PERSON } from "./state";

export function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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
    const videoUrl = (body.videoUrl || "").toString().trim().slice(0, 500);
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
      id: makeId(),
      title,
      artist,
      name: name || undefined,
      message: message || undefined,
      videoUrl: videoUrl || undefined,
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
    const videoUrl = (body.videoUrl || "").toString().trim().slice(0, 500);

    if (!title || !artist) {
      return NextResponse.json({ error: "title and artist are required" }, { status: 400 });
    }

    const state = await getState(showId);

    if (state.queue.length >= MAX_QUEUE) {
      return NextResponse.json({ error: "Queue is at the cap already." }, { status: 400 });
    }

    state.queue.push({
      id: makeId(),
      title,
      artist,
      name: name || undefined,
      message: message || undefined,
      videoUrl: videoUrl || undefined,
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
        videoUrl: state.nowPlaying.videoUrl,
        ts: Date.now(),
      });
    }

    state.lastPlayed = state.nowPlaying;
    state.nowPlaying = {
      title: next.title,
      artist: next.artist,
      name: next.name,
      message: next.message,
      videoUrl: next.videoUrl,
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
    const id = (body.id || "").toString();

    const state = await getState(showId);
    const index = state.queue.findIndex((r) => r.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "That request isn't in the queue anymore." }, { status: 400 });
    }

    const [item] = state.queue.splice(index, 1);
    item.tipped = true;
    if (!item.tipCents) item.tipCents = 0;
    state.queue.unshift(item);

    await setState(showId, state);

    return NextResponse.json({ ok: true, state });
  };
}

export function queueEditHandler(showId: ShowId) {
  return async function POST(req: Request) {
    const body = await req.json();
    const id = (body.id || "").toString();
    const title = (body.title || "").toString().trim();
    const artist = (body.artist || "").toString().trim();
    const name = (body.name || "").toString().trim();
    const message = (body.message || "").toString().trim().slice(0, 200);
    const videoUrl = (body.videoUrl || "").toString().trim().slice(0, 500);

    const state = await getState(showId);
    const index = state.queue.findIndex((r) => r.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "That request isn't in the queue anymore." }, { status: 400 });
    }
    if (!title || !artist) {
      return NextResponse.json({ error: "title and artist are required" }, { status: 400 });
    }

    const existing = state.queue[index];
    state.queue[index] = {
      ...existing,
      title,
      artist,
      name: name || undefined,
      message: message || undefined,
      videoUrl: videoUrl || undefined,
    };

    await setState(showId, state);

    return NextResponse.json({ ok: true, state });
  };
}

export function queueReorderHandler(showId: ShowId) {
  return async function POST(req: Request) {
    const body = await req.json();
    const order = body.order;

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: "order must be an array of ids" }, { status: 400 });
    }

    const state = await getState(showId);
    const byId = new Map(state.queue.map((r) => [r.id, r]));
    const reordered: typeof state.queue = [];

    // Place items in the order the DJ dragged them into
    for (const id of order) {
      const item = byId.get(id);
      if (item) {
        reordered.push(item);
        byId.delete(id);
      }
    }
    // Anything left over arrived after the drag started (e.g. a new viewer
    // request) — keep it instead of silently dropping it, tacked on the end.
    for (const item of byId.values()) {
      reordered.push(item);
    }

    state.queue = reordered;
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

// DJ sets/updates the poll question and options. Saving a new poll always
// resets the vote tally to zero, since it's meant to represent a fresh poll.
export function pollSetHandler(showId: ShowId) {
  return async function POST(req: Request) {
    const body = await req.json();
    const question = (body.question || "").toString().trim().slice(0, 200);
    const options = Array.isArray(body.options)
      ? body.options
          .map((o: unknown) => (o || "").toString().trim().slice(0, 80))
          .filter((o: string) => o.length > 0)
      : [];

    if (!question || options.length < 2) {
      return NextResponse.json({ error: "Add a question and at least 2 options." }, { status: 400 });
    }

    const state = await getState(showId);
    state.poll = { question, options, votes: {} };
    await setState(showId, state);

    return NextResponse.json({ ok: true, state });
  };
}

// A viewer casts (or changes) their vote. One vote per visitorId — voting
// again just overwrites their previous pick rather than adding a second vote.
export function pollVoteHandler(showId: ShowId) {
  return async function POST(req: Request) {
    const body = await req.json();
    const option = (body.option || "").toString().trim();
    const visitorId = (body.visitorId || "").toString().trim();

    if (!option || !visitorId) {
      return NextResponse.json({ error: "Missing option or visitor id." }, { status: 400 });
    }

    const state = await getState(showId);
    if (!state.poll || !state.poll.options.includes(option)) {
      return NextResponse.json({ error: "That poll or option no longer exists." }, { status: 400 });
    }

    state.poll.votes[visitorId] = option;
    await setState(showId, state);

    return NextResponse.json({ ok: true, state });
  };
}

// Removes the active poll entirely, so it stops showing on the request page.
export function pollClearHandler(showId: ShowId) {
  return async function POST() {
    const state = await getState(showId);
    state.poll = undefined;
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
    const videoUrl = (body.videoUrl || "").toString().trim().slice(0, 500);
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
      metadata: { show: showId, title, artist, name, message, videoUrl, tipCents: String(amountCents) },
      success_url: `${origin}${requestPath}?tipped=1`,
      cancel_url: `${origin}${requestPath}?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  };
}
