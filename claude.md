# JE OS — Claude Code Context

**Project:** Personal life-operating-system PWA  
**Hosted:** joel-e7.github.io/JoelOS  
**Architecture:** Single-file vanilla HTML/CSS/JS (~6,600 lines) + Firebase (Auth, Firestore) + Gemini API  
**Last Updated:** April 3, 2026

---

## Quick Facts

- **Owner:** Joel, 25, data science apprentice at Klarius (Cheadle, UK) + Keele University
- **ADHD + possible autism** → design principle: automatic over manual; reduce decision overhead
- **Gym:** Push/Pull/Legs split, tracked as sets/reps/weight/RPE + volume charts + 1RM estimates
- **Padel:** Win/loss per opponent, doubles (two opponents), weakness tagging, coach AI
- **Daily:** Mood (multi-entry), energy (1-10), gym RPE, reading (pages+mins), OTJ hours, habits, journal, phone usage, energy map
- **Weekly:** Priority tracking (5 active + backburner), review scores (professional/health/personal/relationships/learning), streaks, inertia

---

## Architecture Overview

### Stack
- **Frontend:** Vanilla HTML/CSS/JS (no build step, no framework)
- **Backend:** Firebase Auth (Google OAuth only), Firestore, Gemini API
- **Offline:** IndexedDB queue + OPFS backups
- **PWA:** Manifest, service worker, installable on iOS/Android/desktop

### Single-File Constraint
All code lives in `index.html`. This is intentional—no module bundling, no separate CSS/JS files. Trade-off: ~6,600 lines is manageable, but DOM rendering uses `innerHTML` (focus lost on concurrent edits is accepted technical debt).

### Data Schema

**Collections:**
- `daily/{date}` — mood[], energy, gym_rpe, reading, phone, wins[], resistance[], gratitude[], journal, mood_drain[], mood_charge[], reserves (doc per day, ~500 bytes avg)
- `exercises/{id}` — date, category (push/pull/legs), name, sets[], notes, session_id
- `padel/{id}` — type (session/match), date, result (W/L), opponent, partner, sets, feel, highlights, weaknesses[], notes
- `journal/{id}` — date, type (reflection/gratitude/vent/idea), text
- `meals/{id}` — date, name, notes, macros (n/c/p/f)
- `recipes/{id}` — name, macros, ingredients[], steps[]
- `uni_log/{id}` — date, module, otj_mins, details, type (learning/reflection)
- `weeks/{weekKey}` — priorities[], backburner[], energy_map, notes
- `reviews/{weekKey}` — scores (prof/health/personal/rels/learning)
- `user_data/coach_profile` — prs[], deload, days_since_deload, volume_6m
- `user_data/session_today` — exercises[] (for cross-midnight workouts)
- `user_data/habits` — items[] (anchor, action, duration, streak, created)
- `user_data/inertia` — value, lastDate
- `user_data/streak_freezes` — count, lastAwardedStreak
- `user_data/provider_keys` — {google: '...', anthropic: '...', openai: '...', kimi: '...'}
- `user_data/ai_config` — provider
- `ai_saves/{id}` — type (context, suggestion, cache), text, date, ts, hash (for dedup)
- `habit_checks/{date}` — {h0: true, h1: true, ...}

**Firestore Rules:** All data under `users/{uid}/*` — read/write only if authenticated.

---

## AI System

### Provider Abstraction Layer (April 3, 2026)
Supports Google Gemini, Anthropic Claude, OpenAI, Kimi. Swap providers in Settings with zero code changes.

```javascript
const PROVIDERS = {
  google: {
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: { fast: 'gemini-2.0-flash-lite', deep: 'gemini-2.0-flash' },
    normalizeMessages: (msgs) => { /* format conversion */ },
    buildRequest: (messages, maxTokens, thinkingLevel) => { /* return { model, url, body, headers } */ },
    parseResponse: (data) => { /* extract text from API response */ },
    keyParamName: 'key'
  },
  // ... anthropic, openai, kimi follow same pattern
};
```

### Thinking Levels
- `THINK.FAST` (0) → temperature 0.2, fast model → Omnibar parsing, voice routing
- `THINK.NORMAL` (1) → temperature 0.7, fast model → Regular chat, coaching, habits
- `THINK.DEEP` (2) → temperature 0.7, deep model → Ask JE OS, weekly summary, complex reasoning

### Context Builders
Each page/feature has a context function that builds system prompt + data:
- `ctxCoach()` — PBs, 90d volume, deload status, session today
- `ctxInsights()` — 14d data, weekly scores, tone directive
- `ctxJournal()` — 7d entries, moods, energy, tone directive
- `ctxPadel()` — W/L record, per-opponent stats, last 8 matches, weaknesses, tone directive
- `ctxHabits()` — Habit list, current streaks, tone directive
- `ctxMeals()` — Fridge contents, recipes, macros, tone directive

### Tone Detection (`getToneDirective()`)
Automatic, no toggle. Reads 3-day rolling energy/mood/resistance, returns one of five directives:
- **DEPLETED:** Energy <4 + mood <3 → "one small thing at a time, validate difficulty, no lists"
- **AVOIDANCE:** 4+ resistance entries + fine energy → "name the pattern, ask the hard question"
- **LOW_ENERGY:** Today energy ≤3 → "protect recovery, suggest smallest viable version"
- **MOMENTUM:** 2+ gym days in 3 days + energy ≥6 → "energising, push harder, overload window"
- **NEUTRAL:** Everything else → "direct and practical"

Token cost: zero (appended to existing context, ~30 tokens). Applied to all contexts except meals.

### Caching (`askAICached()`)
SHA-256 hash of first 500 chars of single-message prompts. Check `ai_saves` before API call. If cached, instant replay. Prevents duplicate costs on repeated queries (e.g. "What's my all-time deadlift?" asked twice).

### Cost Profile (Gemini)
- **Omnibar:** ~100 tokens per dispatch (estimated £0.027–0.10/year at 2–10 entries/day)
- **Ask JE OS:** ~950 tokens (classifier + fetcher + answerer) vs ~12,000 naive (chunked saves ~85%)
- **Weekly summary:** ~300 tokens (estimated £0.0063/year)
- **Tone detection:** ~30 tokens appended to existing contexts (free, amortized)
- **Voice routing:** ~0 tokens (local regex, no API)
- **Total realistic:** ~$3–5/year depending on usage

---

## Features Built

### Omnibar
- **Ctrl+K** or **⊕ button** → natural language logging
- Parses: "Ate chicken and rice" → meal, "Gym RPE was 8" → daily update, "Won padel 6-4" → match result
- **Dump mode:** Shift to textbox, brain dump multiple entries, AI routes to multiple collections
- Voice input (webkitSpeechRecognition, Chrome/Edge only, en-GB)
- Inline toast shows what was extracted and where

**Supported actions:** `log_meal`, `log_win`, `log_resistance`, `log_mood`, `log_energy`, `log_gym_rpe`, `log_reading`, `log_padel_result`, `add_backburner`, `open_page`, `journal_entry`

### Ask JE OS
- **🔍 button** (bottom-right FAB) or **Ctrl+/** 
- Two-stage semantic search: classifier identifies relevant sources (daily/exercises/padel/journal/uni_log/priorities/habits) → fetches only those collections → answers with deep reasoning
- Shows sources searched
- Voice input supported
- Example: "When did my shoulder start hurting?" → searches journal + exercises, compares injury mentions

### Workout Tracking
- **Exercise logger:** Push/Pull/Legs, sets/reps/weight/RPE, autocomplete on exercise name, warm-up set checkbox
- **Rest timer:** Wall-clock countdown (immune to iOS throttling), picture-in-picture (Canvas → video stream → `requestPictureInPicture()`), survives app switching, iOS 17+ Dynamic Island
- **Volume chart:** 6-month stacked bars (push/pull/legs color-coded)
- **PBs table:** Filters out warm-ups, shows 1RM estimates via Brzycki formula (`weight × (36 / (37 - reps))`)
- **Coach profile:** Two-doc split (coach_profile + session_today), includes deload detection, PB history (90d/all-time)
- **Session feedback:** Per-category (push/pull/legs) — "too easy / about right / too hard"

### Padel Tracking
- **Match logger:** Result (W/L), two opponents, partner, sets, highlights, weakness tags (backhand volley, forehand volley, lob, smash, net positioning, court positioning, serve, return)
- **Session logger:** Just a session marker (for warm-up/drill days)
- **Stats:** Per-opponent W/L record, strength/weakness tallies, Padel Coach AI (match prep, opponent analysis, form review)
- **Weakness drill focus card:** Top 3 most-tagged weaknesses from last 10 matches

### Daily Tracking
- **Mood:** Multi-entry (up to 3 per day), timestamped, averaged for charts
- **Energy:** 1-10 scale
- **Gym RPE:** 1-10 scale
- **Reading:** Pages + minutes + title (optional)
- **Phone usage:** Hours (estimated)
- **Small wins:** Free-form list (up to 10)
- **Resistance:** What you're avoiding (up to 10)
- **Gratitude:** What you're grateful for (up to 10)
- **Energy map:** Two fields — what drained you, what charged you
- **Journal:** Timestamped entries, filterable by type (reflection/gratitude/vent/idea)

### Weekly Workflow
- **Priorities:** 5 active slots + backburner overflow. Effort tagging (⚡ quick / 🔧 medium / 🏋️ heavy). On low energy days, heavy tasks hidden (show with "Show all" button)
- **Review:** Self-scores (professional/health/personal/relationships/learning) 1–10 each
- **Archive:** Completed priorities stored by week
- **Backburner:** Overflow ideas, promote to active with "↑ This week" button

### Stats & Insights
- **Life Radar:** 6-axis canvas chart (gym volume, padel W/L, reading pages, OTJ hours, habit streaks, energy avg)
- **Dual-axis chart:** Energy (line) overlaid on gym volume (bars) — spot energy crashes
- **Correlation hints:** 30d patterns (gym vs energy, phone vs mood, reading vs mood, best/worst day of week)
- **JE OS Wrapped:** Year-end dashboard (aggregated KPIs)
- **Weekly summary button:** "Generate Summary" → one-shot Gemini call → 3 brutally honest bullets (saved to `ai_saves`)

### Energy-Aware UI
- **Bio-responsive theming:** If energy ≤3, override `--gold` to cool grey/blue (low-stimulation UI)
- **Energy-matched task routing:** Backburner + priorities filter by effort level on low energy days
- **Burnout/deload badge:** Top of Today page. Amber if depleted or overreaching, red if both. Dismissible per day.

### Habits
- **Habit stacking:** "After [anchor] I will [action] for [duration]" — e.g., "After morning coffee I will review my 3 priorities for 5 minutes"
- **Daily checkboxes:** Toggle completion, auto-calculate streaks (continues from yesterday or resets to 0)
- **AI habit coach:** Context-aware suggestions based on streak status and your data

### Voice
- **Voice input:** webkitSpeechRecognition (Chrome/Edge, en-GB), all AI pages
- **Voice output:** speechSynthesis with voice picker in Settings
- **Jarvis protocol:** Local regex intercepts voice commands ("go to padel", "open journal", etc.), routes locally with no API call

### Mobile-First
- **Swipe gestures:** Swipe right from left edge → toggle sidebar, swipe left → close
- **iOS install prompt:** Persistent bottom banner, auto-dismisses once installed
- **iPhone Action Button:** Deep-link via `?quicklog=[text]` → pre-fills Omnibar (requires iOS Shortcut automation)
- **Picture-in-Picture:** Rest timer survives app switching, promoted to Dynamic Island on iOS 17+

### Data Resilience
- **Offline queue:** IndexedDB write queue, auto-flush on reconnect
- **OPFS backups:** On Sunday boot, backup full Firestore JSON to Origin Private File System + trigger download. Survives IDB wipes on low storage.
- **CSV/JSON exports:** All collections + full JSON (Settings page)

### Settings
- **AI provider selector:** Switch between Gemini, Claude, OpenAI, Kimi
- **Per-provider API keys:** Each provider gets its own key storage (`user_data/provider_keys`)
- **Voice picker:** Select from available system voices
- **Saved suggestions:** View all saved AI suggestions by type and date

---

## Recent Fixes (April 3, 2026)

### Provider Abstraction Layer (New)
Replaced hardcoded Gemini with pluggable provider system. Four providers pre-configured (Google, Anthropic, OpenAI, Kimi). `askAI()` now reads active provider at runtime, normalizes messages, sends request, parses response. No caller code changes needed.

### Architecture
- **AI Provider Abstraction:** Lines ~5073–5280
- **Settings Page (Provider Selection):** Lines ~6012–6070
- **Settings Handlers:** Lines ~6072–6130

### Previous Session Fixes (Summary)
- `idbFlushQueue` transaction expired before deletes → fixed with proper queue clearing
- Reading autocomplete empty → fixed missing `date` field in daily docs
- Priorities missing closing `</div>` → DOM structure repaired
- Rest timer iOS drift → wall-clock calculation (`targetEnd = Date.now() + secs * 1000`)
- Cross-midnight workouts → 2-hour grace window, date rollover logic
- Priority completion irreversible → 4-second undo window
- Omnibar mood out-of-bounds → clamp before array lookup
- Voice mismatch across devices → one-time toast warning

---

## Key Files

| File | Purpose |
|---|---|
| `index.html` | Everything — HTML, CSS, JS (~6,600 lines) |
| `CHANGELOG.md` | Detailed session log (170+ entries) |
| `ROADMAP.md` | Feature backlog (shipped vs. planned) |
| `JEOS_CONTEXT.md` | Previous session analysis |
| `AI_PROVIDER_GUIDE.md` | How to add/swap providers |
| `claude.md` | This file |

---

## Development Patterns

### Naming
- **Pages:** `renderXPage()` (e.g., `renderTodayPage()`, `renderPadelPage()`)
- **Navigation:** `nav(pageName)` (internal routing, no full reload)
- **State:** Global vars (e.g., `currentPage`, `viewingYesterday`, `_activeProvider`)
- **Firestore paths:** `up('collection/doc')` (shorthand for `users/{uid}/collection/doc`)
- **IDB:** `idbGet(key)`, `idbSet(key, val)`, `idbDel(key)` (simple KV wrapper)
- **Firestore:** `fsGet(path)`, `fsSet(path, data, options)`, `fsColGet(path)`, `fsColAdd(path, data)`, `fsColDel(path, id)`

### DOM Rendering
All renders use `innerHTML` assignment. This means focus is lost on concurrent updates — accepted trade-off for simplicity. Re-render pattern:

```javascript
async function renderXPage() {
  const data = await fetch...();
  let html = `...${data.map(d => `<div>...</div>`).join('')}...`;
  document.getElementById('content').innerHTML = html;
}
```

### Firestore Caching
Multiple pages fetch the same collection (e.g., exercises). Use `fetchDailyRange(days)` which caches locally and reuses across renders. Clears on page nav.

```javascript
let _dailyRangeCache = {};
async function fetchDailyRange(days = 30) {
  if (_dailyRangeCache[days]) return _dailyRangeCache[days];
  const data = await Promise.all(...); // fetch last N days
  _dailyRangeCache[days] = data;
  return data;
}
```

### Error Handling
Most functions return `{ error?, text? }` or silent failures with toast. No try-catch spam — let Firestore errors propagate, catch at UI boundary:

```javascript
const res = await askAI([...], 800);
if (res.error) { toast(res.text); return; }
// use res.text
```

---

## Common Tasks

### Add a New Provider
1. Add entry to `PROVIDERS` object (lines ~5075–5170):
```javascript
mythical: {
  name: 'Mythical AI',
  endpoint: 'https://api.mythical.com/v1/completions',
  models: { fast: 'mythical-small', deep: 'mythical-large' },
  normalizeMessages: (msgs) => { /* convert format */ },
  buildRequest: (messages, maxTokens, thinkingLevel) => { /* return req */ },
  parseResponse: (data) => { /* extract text */ },
  keyParamName: 'Authorization' // or 'key' for URL params
}
```

2. Settings UI auto-generates key input + test button for new provider.

3. Users select in Settings, paste API key, chats route to new provider.

### Update Models (Deprecation)
Model names are in `PROVIDERS[provider].models`. When a model is deprecated:
1. Update the string: `gemini-2.0-flash` → `gemini-2.5-flash`
2. Test with `testProviderKey()` in Settings
3. Done — all chats auto-route to new model

**Note:** `gemini-2.0-flash` and `gemini-2.0-flash-lite` shut down June 1, 2026. Migrate to `gemini-2.5-*` before then.

### Add a New AI Feature
1. **Define context builder:** `ctxNewFeature()` — fetch data, build system prompt, handle tone detection
2. **Create chat instance:** Add to `_chats` object with `name`, `systemPrompt` builder, `context` builder
3. **Wire to UI:** Render chat HTML on your page with `renderChatHTML(_chats['new-feature'])`
4. **Send messages:** Call `aiChatSend('new-feature', userMessage)`

---

## Gotchas & Anti-Patterns

### DOM Focus Loss
Never update a focused input with `innerHTML`. If you need to re-render a form, either:
- Save `input.value`, re-render, restore value
- Use a wrapper div, update only its innerHTML, preserve the input element

### Firestore Timing
`fsSet` with `merge: true` doesn't delete fields. Use `{ field: deleteField() }` if you need to remove a field.

### Cross-Midnight Workouts
If a workout starts at 11:45 PM and you log a set at 12:05 AM, the date changes. `updateSessionToday()` has a 2-hour grace window. Beyond that, the session is considered new (new date).

### IDB Queue Deadlocks
If multiple pages try to flush the IDB queue simultaneously, only one should win. Current code handles this with a `_flushLock` flag. Don't call `idbFlushQueue()` directly from multiple places.

### Voice Picker Fallback
A voice saved on iPhone might not exist on Android. The code shows a one-time toast warning per session. If you want stricter behavior, update `setVoice()`.

### Sidebar Collapse State
On mobile, the sidebar collapses automatically on nav. Don't try to preserve open state across route changes — it's intentional UX.

---

## Testing Checklist (Before Shipping)

- [ ] Test provider switching in Settings (select new provider, test connection, reload, verify it persists)
- [ ] Test Omnibar with all action types (meal, win, resistance, mood, padel, backburner, etc.)
- [ ] Test Ask JE OS with queries across different collections (gym question, journal question, mood question)
- [ ] Test cross-midnight workout (start workout at 11:50 PM, log a set after midnight)
- [ ] Test rest timer on iOS with screen lock (timer should not drift)
- [ ] Test priority undo (complete priority, click Undo within 4 seconds, verify it reappears)
- [ ] Test OPFS backup on Sunday (check browser storage in DevTools, verify JSON was created)
- [ ] Test voice picker on different devices (ensure fallback toast appears if saved voice missing)
- [ ] Test Ctrl+K and Ctrl+/ on desktop (omnibar and ask should open)
- [ ] Test swipe gestures on mobile (swipe right edge to open sidebar, left to close)

---

## Performance Notes

- **Lazy-load daily data:** `fetchDailyRange()` caches per-session. Avoid calling multiple times in one render.
- **Parallel Firestore fetches:** Use `Promise.all()` for collections. `doExportAll()` fetches 365 daily docs + 8 collections in parallel.
- **Minify before AI:** `minifyDailyRow()` compresses `{ date, mood, energy, gym... }` to `24Mar:M4 E6 GPush…` (~40% token reduction).
- **Cache AI responses:** Use `askAICached()` for single-shot calls. Don't cache multi-turn chats.

---

## Debugging

**Browser DevTools:**
- Network tab: Check Firestore requests (POST to `firestore.googleapis.com`)
- Console: `_aiKey`, `_activeProvider`, `_dailyRangeCache` are global, inspect freely
- IndexedDB: Check `jeos_queue` store for pending writes (IDB → Firestore sync)

**Firebase Console:**
- Check `users/{uid}/` collections for data integrity
- Monitor Firestore read/write counts (each page render ~ 3–8 reads)
- Check Auth logs for sign-in issues

**Common Debug Commands:**
```javascript
// Check active provider and key
console.log('Provider:', _activeProvider, 'Key:', _providerKey?.slice(0,10) + '...');

// Check daily cache
console.log('Daily cache keys:', Object.keys(_dailyRangeCache));

// Force re-render (useful for debugging stale HTML)
await renderTodayPage();

// Check IDB queue
idbGet('jeos_queue').then(console.log);

// Check Firestore doc
fsGet(up('daily/2026-04-03')).then(console.log);
```

---

## Roadmap Status

**Shipped in this session:**
- Multi-provider AI abstraction (Google, Anthropic, OpenAI, Kimi)
- Updated Settings UI with provider selector

**Already shipped (not yet marked in ROADMAP):**
- Picture-in-Picture rest timer
- OPFS bulletproof backups
- iPhone Action Button deep-linking
- AI Omnibar + brain dump mode
- Ask JE OS (semantic search)
- JE OS Wrapped (year-end dashboard)
- Life Radar (6-axis canvas chart)
- Dual-axis energy/volume chart
- AI response caching (SHA-256)
- Dynamic thinking levels

**Remaining high-value items:**
- Web NFC tags (tap gym bag → nav workout)
- Service Worker background sync (more robust offline)
- Syllabus PDF ingestion (extract deadlines)
- 2-Minute rule filter (AI identifies quick wins)

---

## Contact / Handoff

This file is for Claude Code context. When handing off to future sessions:
1. Share `index.html` (the actual code)
2. Reference `claude.md` (this file) for architecture + patterns
3. Check `CHANGELOG.md` for recent fixes
4. Read `ROADMAP.md` to see what's next

Joel: If you're reading this from a future session, update the "Last Updated" date above and add a summary of what you shipped.

