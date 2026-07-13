# Mohamed Amir Portfolio

Responsive Android-developer portfolio with modern light/dark theming, motion design and a secure Telegram contact flow.

## Latest updates

- Animated gradient is applied to the top-bar `MO-AM1R` identity only.
- Hero name returned to a clean theme-aware text and outline treatment.
- Skills section now toggles between categorized panels and an icon-based Skill Gallery.
- Restored all four certificates from the oldest portfolio: Dart, Web Front-End, Flutter and Android/Kotlin.
- Added certificate links from the legacy implementation.
- Compact three-column project grid, responsive layouts and animated floating technology tags.
- Secure Telegram group contact through a Netlify Function with group ID `-991103490`.

## Run locally

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

Telegram delivery requires a Netlify function deployment. See [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md).

## Main files

```text
index.html
CSS/styleSheet.css
JS/script.js
Images/skills/
Images/certificates/
netlify/functions/send-telegram.js
netlify.toml
TELEGRAM_SETUP.md
```
