# Supabase CMS integration — Vercel only

This portfolio reads its public content from the same Supabase project used by the Portfolio CMS dashboard.

## Required Vercel environment variables

In **Vercel -> Project -> Settings -> Environment Variables**, add:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here

TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID=YOUR_TELEGRAM_CHAT_ID
ALLOWED_ORIGIN=https://YOUR_PORTFOLIO_DOMAIN
```

Do not add a Supabase secret/service-role key to this project. The publishable key plus RLS is enough for public reads.

## How it works

```text
Portfolio browser
      |
      +---- GET /api/portfolio ----> Vercel Function ----> Supabase REST + RLS
      |
      +---- POST /api/contact -----> Vercel Function ----> Telegram Bot API
```

`/api/portfolio` reads:

- `site_profile`
- `site_settings`
- `experiences`
- `education`
- `projects`
- `skills`
- `certifications`
- `social_links`
- `recommendations`
- `languages`

## Deploy on Vercel

1. Push the portfolio repository to GitHub.
2. Import or connect that repository in Vercel.
3. Add the environment variables above.
4. Redeploy.
5. Verify `https://YOUR_DOMAIN/api/portfolio` returns JSON with `"ok": true`.
6. Submit the contact form and verify `/api/contact` sends the Telegram message.

## Local testing

Use Vercel CLI:

```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
vercel dev
```

Open the URL printed by Vercel, normally `http://localhost:3000`.

### Important: do not use Python's static server for API testing

This command is only a static file server:

```bash
python -m http.server
```

It cannot execute Vercel functions. Therefore these routes will fail:

```text
GET  /api/portfolio -> 404
POST /api/contact   -> 501/404
```

If you see those errors, the code is not necessarily broken; it means the site is being served by the wrong local server.

## Updating content

After the CMS saves a change to Supabase, refresh the portfolio. `/api/portfolio` uses `Cache-Control: no-store`, so there is no intentional application cache. No source-code change, Git commit, or portfolio redeployment is required for ordinary CMS content updates.

If a new skill still does not appear after running through Vercel, check in this order:

1. The CMS is in `VITE_DATA_MODE=supabase`, not demo mode.
2. The new row exists in Supabase `skills`.
3. The row is public/visible according to your RLS setup and `is_visible` field.
4. `/api/portfolio` includes the new skill in its JSON response.
5. Hard-refresh the portfolio.

The CMS and portfolio must point to the same Supabase project.
