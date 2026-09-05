# Mohamed Amir Portfolio

Responsive Android-developer portfolio with modern light/dark theming, motion design, a secure Telegram contact flow, and Supabase-backed content managed by the separate Portfolio CMS dashboard.

## Supabase CMS migration

The visual design remains the same, but portfolio content now loads from Supabase through a Vercel serverless API. Dynamic data includes profile information, experience, education, projects, skills, certifications, social links, recommendations, languages, contact content, SEO settings, and section visibility.

The original HTML content remains as a fallback if the data endpoint is unavailable.

## Required Vercel environment variables

Use the same Supabase project as the CMS dashboard:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
ALLOWED_ORIGIN=https://YOUR_PORTFOLIO_DOMAIN
```

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for setup details.

## Data flow

```text
Portfolio CMS -> Supabase <- /api/portfolio <- Portfolio
                             /api/contact   -> Telegram
```

The public portfolio only reads data allowed by Supabase RLS. It does not have admin/write access.

## Run locally

Use Vercel CLI for the real application:

```bash
npm install -g vercel
vercel link
vercel env pull .env.local
vercel dev
```

Then open the local URL printed by Vercel, normally `http://localhost:3000`.

Do **not** use `python -m http.server` when testing Supabase or Telegram. A basic static server cannot execute `/api/portfolio` or `/api/contact`, so it will return 404/501 errors.

## Main integration files

```text
index.html
CSS/styleSheet.css
JS/portfolio-data.js
JS/script.js
server/portfolio-data.js
api/portfolio.js
api/contact.js
SUPABASE_SETUP.md
.env.example
```

This project is Vercel-only. Netlify configuration and functions have been removed.

## Startup loading experience

The public site now shows a branded animated loader while `/api/portfolio` hydrates the page from Supabase. The loader exits after live data is ready and falls back cleanly to the built-in static snapshot if the API is unavailable.

Local-only files such as `.env`, `.env.local`, `.vercel/`, and `.git/` are intentionally excluded from distributable archives. Keep deployment secrets in Vercel Environment Variables and use `.env.example` only as a template.
