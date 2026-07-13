# SKRT7 — Bio Link Page

A personal bio/link-in-bio page with live Discord presence integration (via [Lanyard](https://github.com/Phineas/lanyard)), animated UI, and a dark/light theme toggle.

🔗 **Live:** [s.skrt7.workers.dev](https://s.skrt7.workers.dev/)

![Preview](https://i.postimg.cc/L6CkKvJQ/Picsart-26-07-08-19-02-19-729.jpg)

## Features

- 🟢 **Live Discord status** — online / idle / dnd / offline, updates automatically
- 💬 **Custom status sync** — mirrors your Discord custom status text & emoji in real time
- 🎨 **Dynamic accent color** — page gradient matches your Discord profile color
- 🖼️ **Avatar + decoration sync** — pulls your current avatar and avatar decoration from Discord
- 🌗 **Dark / light theme toggle** with animated sun-moon switch
- ✨ **Interactive confetti** on hover/touch over the name
- 🔗 **Social link buttons** (Discord, Instagram, GitHub, YouTube, Spotify, Facebook)
- 📱 **Fully responsive**, mobile-first design
- 🔍 **Discord embed support** — rich link preview (Open Graph + Twitter Card meta tags)

## Project Structure

```
skrt7-bio/
├── index.html          # Home page (bio, Discord presence, links)
├── projects.html       # Projects showcase + community Discord server list
├── about.html          # About Me page
├── assets/
│   ├── css/
│   │   └── style.css   # Shared styling (used by index.html)
│   └── js/
│       └── main.js     # Confetti, theme toggle, Discord presence (Lanyard)
├── images/              # Local image assets (if any)
└── README.md
```

> **Note:** `projects.html` and `about.html` are self-contained (their CSS/JS live inline in each file) rather than sharing `assets/`. This keeps each page independent and easy to drop in or remove without affecting the others.

## How it works

Live Discord presence is powered by the [Lanyard API](https://github.com/Phineas/lanyard), a free service that exposes real-time Discord presence data.

**Requirement:** the Discord account being displayed must be a member of the [Lanyard Discord server](https://discord.gg/lanyard) — Lanyard only tracks presence for members of its own server via the Discord gateway.

The Discord user ID is set in `assets/js/main.js`:

```js
const DISCORD_ID = "1217944125555474565";
```

## Deployment

This is a static site — deploy it anywhere that serves static files:

- **Cloudflare Workers / Pages** (currently used)
- GitHub Pages
- Netlify / Vercel
- Any static file host

Just make sure the folder structure stays intact (`assets/css/style.css` and `assets/js/main.js` paths are relative).

## License

Personal project — feel free to fork for inspiration, but please don't republish as-is.

---

Made with ❤️ by [SKRT7](https://github.com/SKRT7-0day)
