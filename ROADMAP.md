# JE OS — Feature Roadmap

> Last updated: 2026-04-03
> Items marked ✅ are live in production. Everything else is planned.

---

## ✅ Built & Shipped

| Feature | Notes |
|---|---|
| Exercise & Reps Tracker | Workout page, sets/reps/weight/RPE, autocomplete, rest timer, volume chart, PBs |
| Padel Sessions + Matches | Doubles support, two opponents, stats tab, win/loss per opponent |
| Reading Logging | Pages + mins required, title autocomplete, streak |
| OTJ Hours Targets & Breakdown | Annual target, per-module progress bars, pace tracking |
| Energy Map | Daily drain/charge fields, weekly view |
| Correlation Hints | 30-day patterns on Stats Overview |
| Advanced Search & Filter | Journal, Padel, Exercises, Uni Log |
| Meals + Recipe Suggestions | Fridge-to-chat AI, recipe book, meal log |
| AI Coaching (Gemini Flash Lite) | Shared chat component, voice I/O, all pages |
| Habit Stacking | Daily checkboxes, streaks, AI habit coach |
| Per-collection CSV + JSON Exports | Daily, exercises, padel, uni, journal, recipes, habits |
| IndexedDB Offline Layer | Local cache + write queue, auto-flush on reconnect |
| PWA | Inline SVG icon, offline-capable |
| Voice Input | webkitSpeechRecognition, en-GB, Chrome/Edge |
| Voice Output + Picker | speechSynthesis, voice selection in Settings |
| Shared AI Chat Component | renderChatHTML, initChat, per-chat context builders |
| Coach Profile (Two-Doc Split) | coach_profile + session_today, PBs (90d/ATH), deload flags |
| Session Feedback | Too easy / about right / too hard per category |
| Padel Coach AI | ctxPadel, match prep, opponent analysis, form review |
| Padel Doubles (Two Opponents) | Opponent 1 + Opponent 2 + Partner fields |
| Multi-Entry Mood | Up to 3 timestamped entries/day, averaged for heatmap |
| Stats 3-Tab Dashboard | Overview / Gym / Padel, 7d/30d/90d range |
| Yesterday Toggle | View and edit previous day's data |
| Priority Archive | Completed priorities stored by week |
| Reading + Padel + Day Streaks | Sidebar pills |
| XSS Sanitisation | Exercise names and notes sanitised before storage and render |
| Weekly Review Scores in AI | ctxInsights and ctxJournal include self-scores |
| Settings Page | Provider selector, per-provider API keys, voice picker, saved AI suggestions |
| Deload Detection (partial) | days_ago cap, deload flag in coach profile context |
| Audio cue (rest timer) | speakText("Time is up") on rest complete — one line, done |
| **Multi-Provider AI Abstraction** | Switch between Google Gemini, Anthropic Claude, OpenAI, Kimi without code changes |

---

## 🔴 Not Built — Ordered by Effort

### Zero Cost / Local Only

~~**Burnout / Deload Indicator**~~ ✅
Visual amber badge at top of app. Local check: `avgEnergy < 4 && avgMood < 3 && avgGymRpe >= 8` over a configurable 3–7 day rolling window. Red if triggered 3 days running. Dismissible per day via localStorage. Thresholds customisable in Settings. The deload flag in the coach profile is already there — this is the user-facing surface.

---

~~**Sunday Intercept**~~ ✅
On Sunday boot, check if `reviews/{weekKey}` has scores. If not, full-screen overlay: "Happy Sunday. Time to review the week." → routes to Review page. Dismissed once per Sunday via `localStorage` flag `jeos_sunday_seen_{weekKey}`. ~20 lines.

---

~~**Morning Card**~~ ✅
Only visible 06:00–10:00. Sits at top of Today page above mood card. Shows: last night's sleep (placeholder until Tasker live) + today's top 3 priorities + habit checkboxes. `renderTodayPage` checks `new Date().getHours()`.

---

~~**Priorities Backburner**~~ ✅
`weeks/{weekKey}.backburner[]` overflow list for mid-week ideas. During Sunday Review, click to promote into next week's active 5. Items carry forward until promoted or deleted.

---

~~**1RM Estimator + Warm-up Set Tags**~~ ✅
Brzycki formula: `weight × (36 / (37 - reps))`. Shown alongside actual PBs in Stats Gym tab. Sets get optional `warmup: bool` field — warm-up sets excluded from volume charts, PB calculations, and coach profile context.

---

~~**Memory Trigger Cards (Spaced Repetition)**~~ ✅
On Uni Log page, if an entry exists from exactly 7 or 30 days ago, inject a "Review this?" card at top. Ebbinghaus curve review. Zero cost — local date filter.

---

~~**Padel Shot / Weakness Tagging**~~ ✅
Multi-select "Struggled with" on match log form: Backhand volley, Forehand volley, Lob, Smash, Net positioning, Court positioning, Serve, Return. Stored as `padel/{id}.weaknesses[]`. Padel Stats shows top 3 most-tagged weaknesses over last 10 matches. Feeds into `ctxPadel` automatically.

---

**Padel Court SVG Heatmap (Error Zones)**
Static SVG of padel court, 6 zones (Net L/R, Mid L/R, Back L/R). Tap zones during match review to tally errors. Stats page shades by error density. **Hold until playing frequently against randoms.**

---

~~**Streak Freezes**~~ ✅
After 7 consecutive days, earn 1 Freeze. Miss a day → deduct Freeze, streak survives. Prevents guilt collapse. Zero cost.

---

~~**The "Inertia" Tracker**~~ ✅
`daily_inertia` in Firestore. Log anything → `+1`. 24 hours with nothing → `-2`. Velocity number in sidebar. Rewards continuous engagement without punishing focus shifts. Better fit for ADHD than brittle streaks.

---

~~**Done Confetti**~~ ✅
Vanilla JS canvas particle burst on final Priority completion or OTJ target hit. 2-second animation. Zero cost.

---

~~**Bio-Responsive UI Theming**~~ ✅
`setTheme()` overrides CSS variables. If `today.energy <= 3`, mute `--gold` to cool grey/blue. Low-stimulation UI on bad days.

---

~~**Energy-Matched Task Routing**~~ ✅
`effort: 1|2|3` tag on Backburner/Priorities. If `energy <= 3`, hide effort-3 tasks. OS stops demanding what the body can't deliver.

---

~~**Native Swipe Gestures**~~ ✅
`touchstart`/`touchend` listeners. Swipe right from left edge → toggle sidebar. Swipe left → close.

---

~~**Ctrl+K Global Command Palette**~~ ✅
`(ctrlKey || metaKey) && key === 'k'` → open Omnibar. Type `nav padel` to route, or `log 2h data ethics` to trigger AI parser. Notion/Obsidian feel on desktop.

---

~~**The "Jarvis" Protocol (Zero-Cost Voice Routing)**~~ ✅
Intercept `webkitSpeechRecognition` transcript before sending to Gemini. Local regex: if transcript matches `go to|open|navigate`, route locally with no API call. Optional voice confirmation via `speakText()`. Saves tokens on simple navigation.

---


**Picture-in-Picture Rest Timer**
Hidden `<canvas>` draws countdown, converted to video stream, `requestPictureInPicture()` pins to corner. Survives app switching. iOS 17+ promotes to Dynamic Island automatically.

---

**OPFS Bulletproof Backups**
`backupToOPFS()` during Sunday Weekly Review. Full Firestore JSON state written to Origin Private File System. Protects against IDB wipes on low storage.

---

**True Background Sync (Service Worker)**
Service Worker Background Sync API. Offline gym logging queued, syncs when connection restores. More robust than current IDB queue for native mobile.

---

**iPhone Action Button Deep-Linking**
Apple Shortcut → prompts for text → opens `https://joel-e7.github.io/JoelOS/?quicklog=[TEXT]`. Boot function reads `URLSearchParams.get('quicklog')`, routes to AI Omnibar. Zero cost beyond existing Omnibar.

---

~~**iOS Install Prompt**~~ ✅
Detect `navigator.userAgent` for iPad|iPhone. If `!window.navigator.standalone`, show persistent tooltip: "Tap Share → Add to Home Screen." Auto-dismisses once installed.

---

### Needs API / External Setup

**AI Omnibar — Natural Language Logging**
Floating "+" button (bottom-right, always visible). Type anything:
- "Ate chicken and rice" → logs to meals
- "Gym RPE was 8" → updates today's gym_rpe
- "Won padel 6-4 against Dave" → pre-fills padel match form
- "Feeling anxious about the deadline" → adds to resistance

Gemini parses to structured JSON: `{ "action": "log_meal", "data": { "name": "chicken and rice" } }`. App executes silently. Toast shows what was extracted and where it went. Ctrl+K and iPhone Action Button both feed into this.
Supported actions: `log_meal`, `log_win`, `log_resistance`, `log_mood`, `log_padel_result`, `log_reading`, `open_page`.
Token cost: ~£0.027–0.10/year at 2–10 entries/day.

---

**Omni-Dump AI Router (Brain Dump)**
Single large textarea. Stream-of-consciousness: "Need to finish Data Ethics. Shoulder weird after bench. Burned out." Gemini routes to multiple destinations using strict JSON schema. Multiple `fsSet`/`fsColAdd` calls in background. Toast shows extraction summary.
Token cost: ~£0.00035 per dump.

---

**Walk & Talk Brain Dumps (Gemini Audio API)**
`MediaRecorder` records voice as .webm blob. Base64 → Gemini REST. Natural speech → JSON routing across collections. 3-minute ramble → logged across Gym/Backburner/Padel.
Token cost: ~£0.00144 per 2-minute dump.

---

**Sunday Executive Summary**
Button on Weekly Review: "✨ Generate Summary". One-shot AI call ingesting 7-day data (priorities completed, gym volume, padel win rate, mood/energy averages, resistance patterns). Returns 3 brutally honest bullets. Saveable to `ai_saves`.
Token cost: ~£0.0063/year.

---

**Ask JE OS — Semantic Search**
Global floating "🔍 Ask" button. Natural language queries across all data. Chunked approach: classifier call identifies question type (gym/journal/padel/mood), fetches only the relevant collection slice.
Examples: "When did my shoulder start hurting?", "What was stressing me last month?"
Token cost: ~£0.0060/year at 5 queries/week.

---

~~**The "Tough Love" AI Toggle**~~ ✅
Settings toggle: Supportive Coach ↔ Drill Sergeant. System prompt appends dynamically. Supportive validates resistance and suggests smallest next step. Drill Sergeant calls out excuses using actual data. State in localStorage, applied to all AI chats.
Zero extra API cost.

---

**Instant Syllabus Ingestion (Gemini Document API)**
"📄 Upload Syllabus" on Uni page. Upload PDF → Gemini extracts assignments, deadlines, topics as JSON → auto-populates uni_log targets + backburner tasks for the semester.
Token cost: ~£0.0005 per PDF.

---

**2-Minute Rule Auto-Filter**
Toggle on Priorities/Backburner. Sends backburner to Gemini: "Which tasks take under 2 minutes? Return JSON array." Highlights in green. Token cost: ~£0.00015 per run.

---

**JE OS Wrapped (Year-End Dashboard)**
`nav('wrapped')`. Aggregates full-year: total kg lifted, top padel opponent, win rate, uni hours, best mood month, most-avoided resistance task, pages read. One-shot, saveable.
Token cost: ~£0.0008/year.

---

**Pro-Tier Visualisations (Chart.js CDN)**
Radar chart: Gym/Padel/Uni/Reading/Habits as RPG stats. Dual-axis: Energy (line) over Gym volume (bars) to visualise energy crashes. Zero ongoing cost — CDN only.

---

**AI Response Caching (SHA-256 Hash)**
Hash prompt, check `ai_saves` before API call. If cached, render instantly. Prevents duplicate costs on repeated queries. Zero ongoing cost once cached.

---

**Dynamic Thinking Levels**
`thinking_budget` parameter per AI call. Low for Omnibar parsing, high for Ask JE OS and Weekly Review. Prevents hallucinations on complex queries while keeping simple ones fast.

---

**Minifier Data Pipeline**
`minifyForAI(data)` before Gemini calls. Dense format: `{"date":"2026-03-24","energy":5}` → `24Mar:E5`. ~40% token reduction on data-heavy contexts.

---

**Sleep Data via Tasker + Health Connect**
OHealth → Health Connect → Tasker → Firebase REST → `daily/{date}.sleep`. Fields: `total_mins, deep_mins, rem_mins, light_mins, awake_mins, hrv`. JE OS renders stacked sleep bar chart + HRV trend line. Android only. Zero AI tokens.

---

**Note Import (Notability / GoodNotes)**
Notability has no public API. GoodNotes iCloud sync unverified. Low priority until access confirmed. Fallback: iOS Shortcuts text export → manual upload.

---

**Native Mobile App**
Flutter or React Native. Only worthwhile if PWA hits limitations (currently it hasn't). Google Play: one-time £25. iOS: £99/year. Long-term.

---

## 🧱 Technical Debt (Accepted)

| Issue | Notes |
|---|---|
| Template literal DOM wipes | `innerHTML = html` on every render — focus lost on background sync. Full rewrite required. Accepted. |
| Module scope exports | Dozens of `window.x = x` for onclick handlers. Would need event delegation refactor. Accepted. |
| Global state mutations | `currentPage`, `viewingYesterday`, `_allExercises` mutated globally. Accepted. |
| Mobile chart tooltips | `title` attributes don't fire on iOS/Android touch. Custom tooltip layer needed. |
| API key in DevTools | Visible in Network tab. Cloudflare Worker proxy fixes it. Limited blast radius — single-user OAuth. |
| Voice input browser support | Chrome/Edge only. Toast shown on unsupported browsers. |

---

## 🗓 Suggested Build Order

**High value, low effort:**
1. Burnout / Deload Indicator
2. Sunday Intercept
3. Morning Card
4. 1RM Estimator + Warm-up Tags
5. Padel Weakness Tagging
6. Backburner List
7. Streak Freezes + Inertia Tracker

**Medium effort, high value:**
8. AI Omnibar (natural language logging)
9. Ask JE OS (chunked semantic search)
10. Sunday Executive Summary
11. Ctrl+K + Swipe Gestures
12. Chart.js Radar + Dual-Axis

**Needs external setup first:**
13. Sleep via Tasker + Health Connect
14. Syllabus Ingestion (PDF upload)
15. Walk & Talk Brain Dumps (audio API)
