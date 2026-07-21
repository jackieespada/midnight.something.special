# The Midnight Something Special — Request Queue

Three pages:

- `/request` — public song request form (share this link with viewers)
- `/overlay` — the stream graphic, exactly 1920x1080, for OBS
- `/dj` — control panel to advance the queue while you're live (don't share this link publicly)

## 1. Install and run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/request`, `/overlay`, and `/dj` to try it out.
Without KV configured (see below), state is stored in memory and resets whenever the server restarts — that's expected locally.

## 2. Deploy to Netlify

1. Push this folder to a GitHub repo.
2. In Netlify, click **Add new site** → **Import an existing project** → connect GitHub → pick the repo.
3. Netlify auto-detects the Next.js settings from `netlify.toml` — just click **Deploy**.
4. Once deployed, you'll get a URL like `https://midnight-something-special.netlify.app`.

## 3. Storage

This app uses **Netlify Blobs** for the live queue/now-playing state — it's built into Netlify, so there's nothing extra to set up or connect. It works automatically once deployed.

(Locally, before deploying, state is just held in memory and resets whenever the dev server restarts — that's expected.)

## 4. Point the QR code at your real domain

`app/overlay/page.tsx` automatically builds the QR code from whatever domain the page is loaded from, so once it's deployed, it just works — no manual edits needed. If you add a custom domain in Netlify, the QR updates automatically too.

## 5. Set up OBS

1. Add a **Browser Source**.
2. URL: `https://yourdomain.com/overlay`
3. Width: `1920`, Height: `1080`
4. Check "Shutdown source when not visible" off, so it keeps polling for updates even between scenes.

## 6. Running the show

- Share your `/request` link (or the QR code on stream) so viewers can submit songs.
- Open `/dj` yourself (or have someone helping you run it) to see the queue and hit **"Pull next request → Now playing"** as you move to each new song.

## Customizing

- Replace `/public/bg.webm` and `/public/thumbnail.jpg` with updated art any time — just keep the same filenames, or update the references in `app/overlay/page.tsx` and `app/request/page.tsx`.
- Colors and layout live in `app/globals.css` and inline styles in each page — all in your teal/magenta/purple/gold palette already.
