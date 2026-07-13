# Telegram Contact Setup

The Telegram form now uses a Netlify Function, so the bot token never appears in browser JavaScript.

## Important security step

The token previously used by the old portfolio has been exposed. Revoke it in **BotFather** and generate a new token before deployment. Do not paste the new token into `JS/script.js`, `index.html`, GitHub, or any public file.

## 1. Add the bot to the group

1. Add the bot to the target Telegram group.
2. Allow it to send messages.
3. The configured group ID is:

```text
-991103490
```

The function uses that ID by default. You can override it with `TELEGRAM_CHAT_ID`.

## 2. Add the Netlify environment variables

Open **Netlify → Site configuration → Environment variables** and add:

```env
TELEGRAM_BOT_TOKEN=your_new_bot_token
TELEGRAM_CHAT_ID=-991103490
ALLOWED_ORIGIN=https://mohamedamir.netlify.app
```

Do not add a trailing slash to `ALLOWED_ORIGIN`.

## 3. Deploy the complete project

Deploy through a Git-connected Netlify site or Netlify CLI so the function is built:

```bash
npm install -g netlify-cli
netlify login
netlify link
netlify env:set TELEGRAM_BOT_TOKEN "YOUR_NEW_TOKEN"
netlify env:set TELEGRAM_CHAT_ID "-991103490"
netlify env:set ALLOWED_ORIGIN "https://mohamedamir.netlify.app"
netlify deploy --prod
```

The deployment must contain:

```text
netlify.toml
netlify/functions/send-telegram.js
```

Dragging only the static website files into Netlify Drop will not reliably build the serverless function.

## 4. Test and troubleshoot

Submit the form on the deployed site. On failure, open **Netlify → Functions → send-telegram → Logs**.

Check that:

- The new token is correct.
- The bot is still a member of the group.
- The deployment includes `netlify/functions/send-telegram.js`.
- `ALLOWED_ORIGIN` matches the live domain exactly.

The form also keeps a direct **Open Telegram** fallback.
