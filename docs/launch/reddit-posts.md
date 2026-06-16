# Putt Party — Reddit & community launch posts

Ready-to-adapt drafts for a low-key, helpful launch. Putt Party is **free, no
app, no account**, now bilingual (DE/EN). Lead with usefulness, not marketing.

> **Before posting — Reddit etiquette (this makes or breaks a launch):**
> - Read each subreddit's rules first; many require a flair (e.g. "Show & Tell")
>   or restrict self-promo to specific days/threads.
> - Post from an account with some history/karma. Brand-new accounts get
>   auto-removed in most subs.
> - One subreddit per day, not a blast. Space them out over ~2 weeks.
> - Reply to every comment for the first few hours — engagement drives reach.
> - Be transparent: it's your project, it's free, here's the source. Redditors
>   reward honesty and punish "growth-hack" tone.
> - Lead with the **board screenshot** (`public/img/board.png`) or a short screen
>   recording of a live update — the realtime board is the wow moment.
> - Don't reuse the identical title/body across subs (spam filters notice).

---

## r/SideProject — "I built a free live leaderboard for mini-golf parties"

**Title:** I built a free, no-login live leaderboard for mini-golf tournaments (German + English)

**Body:**

> A friend ran a mini-golf afternoon for a staff party and was tallying scores on
> paper, so I built **Putt Party**: create a game in ~30 seconds, put up a QR
> code, and everyone enters their score from their own phone. A big screen shows
> the ranking updating **live** — podium, ties, rank changes.
>
> - No app, no account. The organiser gets one secret link to manage their game.
> - Works on a beamer/TV for the "big screen" moment.
> - Free. Now available in German and English.
>
> Tech, for the curious: Cloudflare Workers + Hono (SSR JSX), D1 (SQLite), one
> Durable Object per game for the realtime board over WebSockets, htmx for the
> forms.
>
> Try it (demo board updates live as people enter scores): https://puttyparty.fabraham.dev
>
> Happy to answer anything — and very open to feedback on the entry flow.

---

## r/selfhosted — for the open-source / run-it-yourself angle

**Title:** Putt Party — a self-hostable live mini-golf tournament leaderboard (Cloudflare Workers + D1)

**Body:**

> Sharing a small project that's both a free hosted service and fully
> self-hostable. One deployment hosts many independent games; players scan a QR
> and submit scores from their phone, a big screen shows a live leaderboard.
>
> - Runs entirely on Cloudflare Workers + D1 + Durable Objects — cheap/free tier
>   friendly, no server to babysit.
> - Admin behind Cloudflare Access; self-service organisers get a capability-URL
>   manage link (no accounts).
> - No third-party tracking, fonts self-hosted, DE/EN.
>
> Hosted demo: https://puttyparty.fabraham.dev
> Source / deploy guide: <link to your repo>
>
> Feedback on the deploy story welcome.

---

## r/minigolf (and r/golf "show me your setup" threads) — the community angle

**Title:** Made a free live scoreboard for casual mini-golf tournaments — QR in, big screen out

**Body:**

> If you ever organise a casual mini-golf round (work party, club, birthday), I
> made a free thing that might help: players scan a QR, type their score per hole
> or as a total, and a screen shows the live ranking. No app or sign-up.
>
> It's free and I'm not selling anything — just sharing in case it's useful.
> Demo: https://puttyparty.fabraham.dev
>
> Would love to hear how you currently keep score.

---

## German — r/de "Selfmade"/Projekte-Thread, church/youth & event communities

**Titel:** Kostenlose Live-Bestenliste fürs Minigolf-Turnier (Sommerfest, Jugendgruppe, Firmenfeier)

**Body:**

> Für ein Gemeinde-Sommerfest habe ich **Putt Party** gebaut: In ~30 Sekunden ein
> Spiel anlegen, QR-Code aufhängen, alle tragen ihren Score vom eigenen Handy ein
> — und auf dem grossen Bildschirm aktualisiert sich die Rangliste live (Podium,
> geteilte Plätze, Auf-/Abstiege).
>
> - Kostenlos, keine App, kein Konto. Die organisierende Person bekommt einen
>   geheimen Verwaltungs-Link.
> - Läuft auf Beamer/TV für den "grossen Moment".
> - Kein Tracking, Schriftarten selbst gehostet, DE/EN.
>
> Demo (Board aktualisiert sich live): https://puttyparty.fabraham.dev
>
> Feedback gern — vor allem zur Eingabe-Maske.

> **Hinweis für DE-Subs:** r/de und viele deutsche Subs entfernen reine
> Eigenwerbung. Am besten in einem "Zeig dein Projekt"-/Selfmade-Thread posten
> oder in themennahen Communities (Jugendarbeit, Gemeinde, Eventorga) und dort
> zuerst Mehrwert/Story erzählen.

---

## Follow-up content ideas (after the first posts land)

- A 10-second screen recording / GIF of the board reshuffling as a new score
  comes in — far more compelling than a static image; pin it as a comment.
- A short "how it's built" write-up for r/webdev or r/cloudflare (Durable Object
  per game + WebSocket hibernation is a genuinely interesting pattern).
- Ask one question at the end of each post to invite comments (drives ranking).
