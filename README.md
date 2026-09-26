# Clutch Lab

**A practice journal for Counter-Strike 2 players.** Log a match, notice why you lost duels, and take one concrete focus into the next session.

**[Try the live demo](https://assumie.github.io/clutch-lab/)** · [Made by Esther Lee Qian Hui](https://github.com/assumie)

## What you can do

- Explore a clearly labeled set of **fictional demo matches** before adding your own.
- Log a date, map, kills, deaths, headshot kills, opening duel results, one repeat mistake, and a short reflection.
- See K/D, opening duel win rate, headshot rate, a recent session chart, and the most common mistake in your log.
- Get a small, relevant practice prompt based on the mistake you log most often.
- Delete individual personal sessions and export your personal log as JSON.

Your own sessions are saved in this browser's `localStorage`. There is no account, server, external CS2 API, or cross-device sync. Demo data is never mixed into your own log. Keep a JSON export if you need a backup; clearing browser storage can erase your records. This is a practice reflection tool, not an official Counter-Strike product or a measure of in-game skill.

## Run locally

This is a static HTML/CSS/JavaScript app with no build step or dependencies. From the project folder:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`. You can also open `index.html` directly in a browser, though local storage behavior may vary for `file://` pages.

## How it works

1. Select **Start my log** or **Log a session**.
2. Enter your match numbers and pick one mistake you want to improve.
3. Check the chart, pattern count, and practice prompt after a few sessions.
4. Use **Export JSON** to save a copy of your personal entries.

The dashboard computes its summaries from the sessions currently shown. K/D uses total kills divided by total deaths; headshot rate uses headshot kills divided by kills; opening duel rate uses wins divided by wins plus losses. A missing denominator shows `—`.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Accessible dashboard and session form |
| `styles.css` | Responsive purple and neon visual system |
| `app.js` | Demo data, local journal, summaries, and export |

## Next ideas

Practice goals by map, session filters, and import from a previous JSON export would make good follow-up features. The current version is intentionally small enough to use after every match.
