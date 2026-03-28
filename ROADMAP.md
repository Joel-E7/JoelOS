# JE OS — Feature Roadmap

## Overview
This document tracks potential features and enhancements for JE OS. Items are grouped by category and priority based on user requests and identified gaps.

---

## 🎯 HIGH PRIORITY (Next cycle)

### 1. Note Import Integration (API)
**Status**: Planned

**Description**: Integrate with Notability and GoodNotes APIs to sync notes directly into JE OS journal.

**Why**: Users already take notes in these apps; API integration creates real-time unified capture without manual uploads.

**Implementation Plan** (Option B - API Integration):
- Notability API: Real-time or scheduled sync of newly created/modified notes
- GoodNotes Cloud: Sync via iCloud integration
- Metadata extraction: date, title, tags from note properties
- Store notes + link to journal entries or uni log automatically
- Estimated effort: High (3-5 days for API auth + sync logic)

**Data Structure**:
```json
{
  "imported_notes": {
    "note_id_123": {
      "date": "2026-03-27",
      "title": "SQL learnings",
      "source": "notability", // or goodNotes
      "file_url": "gs://bucket/...",
      "tags": ["sql", "learning"],
      "synced_at": "2026-03-27T14:30:00Z",
      "linked_to": ["journal/entry_456", "uni_log/entry_789"]
    }
  }
}
```

**Data Storage Considerations**:
- Firebase Storage for file blobs (PDFs, images, audio)
- Firestore for metadata + sync timestamps
- Consider 5MB document size limits; stream larger files

**UI Changes**:
- New "Notes" page in sidebar
- Connection status indicator (syncing/synced/error)
- Display imported notes with source icon (Notability/GoodNotes logo)
- Link imported notes to journal entries or uni log
- Optional: full-text search across notes

**Setup**:
- Requires OAuth2 for Notability/GoodNotes authentication
- Store API tokens securely in user's Firebase config
- Daily or real-time sync (webhook-based if available)

---

### 2. Exercise & Reps Tracker
**Status**: Planned

**Description**: Track workout exercises with sets, reps, and weight. More granular than current gym toggle (Push/Pull/Legs). Auto-tick gym categories. Import running/exercise data from wearables.

**Why**: Current gym tracker is binary (done/not done). Users want to log actual work: "Bench press 4x8@80kg", not just "push day done". Wearable sync eliminates manual running logs.

**Machine Catalogue** (Anytime Fitness Rugeley):
- Pre-populated machine list from Anytime Fitness Rugeley
- Add custom exercises: user can input name + category (machine/free weight/bodyweight)
- Machines: Leg Press, Hack Squat, Leg Curl, Leg Extension, Chest Press, Pec Deck, Lat Pulldown, Cable Row, Shoulder Press, Bicep Curl, Tricep Dip, Assisted Dip
- Free weights: Dumbbell Press, Barbell Bench, Squat Rack, Deadlift platform, etc.
- Bodyweight: Pull-ups, Dips, Push-ups, Rows, etc.

**Features**:
- Log exercise name, sets, reps, weight/resistance
- Autocomplete from machine list + custom exercises user has added
- **Auto-detect gym category**: If logging bench press → auto-tick "Push" for that day
- Track Progressive Overload (weight increases over time)
- Weekly volume calculations (total reps × weight)
- Monthly chart: volume trend per exercise
- REST timer integration (visual countdown between sets)
- **Wearable Integration** (optional):
  - Import running data from OnePlus Watch 3 / Amazfit Helio via oHealth or Amazfit API
  - Auto-log running sessions (date, duration, distance, pace)
  - Sync daily or on-demand

**Flexibility Sessions**:
- Toggle "Flexibility Day" once per week (e.g., Monday)
- Pre-set routine or user-defined routine
- Simple checklist: Warm-up, stretches (list), cool-down
- Log completion + notes
- Track consistency (% weeks completed)
- **Gym Streak** (new): Weeks where Push + Pull + Legs + Flexibility all completed (tracked in Gym tab, not main sidebar)

**Data Structure**:
```json
{
  "exercises": {
    "exercise_id_123": {
      "date": "2026-03-27",
      "time": "15:30",
      "name": "Bench Press",
      "category": "machine", // or "free_weight", "bodyweight"
      "gym_category": "push", // auto-detected for gym toggle
      "sets": [
        { "reps": 8, "weight": 80 },
        { "reps": 8, "weight": 80 },
        { "reps": 8, "weight": 80 },
        { "reps": 5, "weight": 85 }
      ],
      "notes": "Strong today",
      "rpe": 8 // Rate of Perceived Exertion (1-10)
    }
  },
  "flexibility_sessions": {
    "session_id_456": {
      "date": "2026-03-24",
      "routine_name": "Weekly Mobility",
      "completed": true,
      "exercises": [
        { "name": "Cat-Cow", "reps": "10" },
        { "name": "Hip Flexor Stretch", "time": "30s" }
      ],
      "notes": "Felt good"
    }
  },
  "wearable_runs": {
    "run_id_789": {
      "date": "2026-03-27",
      "source": "oneplus_watch", // or "amazfit"
      "duration_mins": 35,
      "distance_km": 5.2,
      "pace_min_per_km": 6.7,
      "synced_at": "2026-03-27T10:30:00Z"
    }
  }
}
```

**UI Changes**:
- New "Workouts" page (or expand Gym section)
- Quick-add form: Exercise name (autocomplete) → sets input (dynamic rows, each row: reps + weight)
- History view: last 20 exercises with edit/delete
- Stats: volume trends, strength progression, most-logged exercises
- Optional: Stopwatch/timer for rest periods
- Flexibility tab: weekly routine checklist, completion history
- **Wearable setup**: Settings page to connect OnePlus/Amazfit account (OAuth2 or API key)
- **Gym Streak** (in Gym tab): "4 weeks completed (Push, Pull, Legs, Flexibility)"

**Integration with existing Gym tracker**:
- Keep Push/Pull/Legs toggle as daily summary
- Exercise log auto-ticks the matching category (if Bench logged → Push auto-ticked)
- Flexibility session must be logged separately, must be checked for weekly streak
- Wearable runs logged automatically, counted toward activity tracking
- If any exercise logged that day → gym toggle auto-checks that category

**API Feasibility** (to verify):
- OnePlus Watch 3: oHealth API documentation (needs verification for free/open access)
- Amazfit Helio: Amazfit Health API or oHealth integration (verify OAuth availability)
- Fallback: Manual run logging if APIs not accessible

**Estimated Effort**: Medium-High (4-5 days: machine list + exercise logic + gym auto-check + wearable API integration)

---

### 3. Padel Match Result Tracker (Merged with Sessions)
**Status**: ✅ DONE (2026-03-27)

**Description**: Full redesign merging casual sessions and competitive matches on single page with match stats.

**Features Implemented**:
- Type selector: Session vs Match toggle (golden highlight on active)
- **Sessions**: date, time, feel emoji, notes
- **Matches**: opponent, opponent skill level (1-5), partner, format (singles/doubles), court/venue, result (win/loss), sets, highlights
- **Match Stats**: Win/loss record per opponent displayed on page
- **Monthly Progress**: Combined session + match counter, visual progress bar toward 8
- **History View**: Last 15 activities sorted by date, shows different layouts for sessions vs matches
- **Edit/Delete**: Full CRUD on all entries via modal

**Data Structure**:
```json
{
  "type": "session",       // or "match"
  "date": "2026-03-27",
  "time": "19:00",         // (match only)
  "feel": "😊",            // (session only)
  "notes": "Felt sharp",   // (session only)
  "opponent": "Carlos",    // (match only)
  "skill": 4,              // (match only, 1-5)
  "partner": "Alex",       // (match only, if doubles)
  "format": "doubles",     // or "singles" (match only)
  "court": "La Sportiva",  // (match only)
  "result": "win",         // or "loss" (match only)
  "sets": "6-4, 4-6, 6-3", // (match only)
  "highlights": "Excellent serves"  // (match only)
}
```

**UI Layout**:
- Quick type selector (Session | Match buttons, toggle styling)
- Conditional field groups (session vs match inputs hidden/shown)
- Match stats card (win/loss record by opponent)
- Monthly progress bar + counts
- Unified history with type-aware rendering

**Estimated Effort**: 1.5 hours — COMPLETE

**Features**:
- **Session vs Match**: Toggle between logging casual play vs competitive match
- Casual sessions: date, time, feel emoji, notes, monthly volume
- Competitive matches: date, time, opponent(s), court, format, sets/points, win/loss
- Partner/Team tracking (for doubles)
- Win/loss record with ELO-style rating (optional)
- Monthly/seasonal stats: win rate, average sets per match, best opponent matchups, venue breakdown

**Data Structure**:
```json
{
  "padel_activity": {
    "activity_id_123": {
      "date": "2026-03-27",
      "type": "session", // or "match"
      "time": "19:00",
      "feel": "😊",
      "notes": "Felt sharp today"
    },
    "match_id_456": {
      "date": "2026-03-27",
      "type": "match",
      "time": "19:00",
      "format": "doubles", // or "singles"
      "court": "La Sportiva Gym",
      "opponent": {
        "name": "Carlos",
        "skill_level": 4 // 1-5 scale or estimate
      },
      "partner": {
        "name": "Alex",
        "available_future": true
      },
      "result": "win", // or "loss"
      "sets": [
        { "us": 6, "them": 4 },
        { "us": 4, "them": 6 },
        { "us": 6, "them": 3 }
      ],
      "highlights": "Great serves today",
      "areas_to_improve": "Volley consistency",
      "feel": "😄"
    }
  }
}
```

**UI Changes**:
- Single "Padel" page with two sections: Sessions + Matches
- Quick-add form: Type selector (session/match) → relevant fields
- **Sessions**: date, time, feel, notes; monthly progress bar toward 8-session target
- **Matches**: opponent → partner → court → result → sets; match history with opponent stats
- Stats dashboard: 
  - Total sessions this month + progress to 8
  - Match record: Win/Loss ratio, vs. each opponent
  - Court/venue breakdown
  - Timeline: seasonal view (wins/losses by month)
- Edit/delete on individual entries

**Integration with existing Gym tracker**:
- Padel activity counts toward overall activity log
- Can correlate padel sessions with mood/energy trends

**Estimated Effort**: Medium (2-3 days)

---

## 📋 MEDIUM PRIORITY (Next 2-4 weeks)

### 4. Reading Logging (Pages & Time Required)
**Status**: ✅ DONE — Both required (2026-03-27)

**Description**: Current reading tracker accepts either pages or time. **Decision: Both fields required (pages AND time mandatory)**.

**Rationale**: Better data quality for correlation analysis. Slightly higher friction, but acceptable for analytics value.

**Implementation**:
- Both pages AND time are mandatory fields
- Reading streak counts only entries with both values
- Stats handle edge cases (display both metrics separately)
- No streak points if either field missing

**Estimated Effort**: Low (validation logic update)

---

### 5. OTJ Hours Targets & Breakdown
**Status**: Design planning needed

**Description**: Clarify OTJ hour tracking requirements for apprenticeship targets.

**Questions**:
- Annual target? (e.g., 200 hours/year for apprenticeship)
- Breakdown by module? (e.g., 50h CSC-10076, 50h CSC-10077, etc.)
- Monthly burndown chart? (visualise progress toward annual target)
- Trigger alerts if falling behind? (e.g., "On pace for 180h, need 200h")

**Data Structure**:
```json
{
  "otj_targets": {
    "annual": 200,
    "by_module": {
      "CSC-10076": 50,
      "CSC-10077": 50,
      "CSC-10082": 50,
      "CSC-10078": 50
    }
  },
  "otj_progress": {
    "2026": {
      "ytd_total": 42,
      "by_module": {
        "CSC-10076": 12,
        "CSC-10077": 15,
        "CSC-10082": 8,
        "CSC-10078": 7
      }
    }
  }
}
```

**UI Changes**:
- Uni log page: Show breakdown by module (progress bars)
- Stats page: Annual OTJ progress toward target
- Settings: Configure annual target + module allocation

**Estimated Effort**: Low (1-2 days design + calculation logic)

---

### 6. Energy Map Timing & Daily vs Weekly
**Status**: ✅ DONE — Option B chosen (2026-03-27)

**Description**: Energy Map now logs at daily level with weekly synthesis.

**Decision**: Option B (daily tracking, weekly synthesis).
- Daily: Log brief charged/drained events (optional notes)
- Weekly: Scroll through week's entries, synthesize patterns on review day
- Allows granular correlation without daily friction

**Implementation**:
- Energy Map sidebar shows daily quick-add (collapsible)
- Weekly Review page has full week view for synthesis
- Can correlate daily mood + daily events → find patterns

**Estimated Effort**: Low-Medium (1-2 days for UI + data structure)

---

### 7. Correlation Hints & Insights
**Status**: Designed (JSON export currently available)

**Description**: Export individual data collections as CSV for spreadsheet analysis or external tools.

**Options**:
- Uni Log → CSV (date, module, OTJ hours, learning notes)
- Padel → CSV (date, feel, notes, monthly count)
- Journal → CSV (date, type, text)
- Exercises → CSV (date, exercise, sets, reps, weight)
- Daily → CSV (date, mood, energy, gym, phone hours, etc.)

**Why**: Some users prefer spreadsheet analysis; easier to share filtered data.

**Estimated Effort**: Low-Medium (1-2 days)

---

### 9. Advanced Filters & Search
**Status**: Planned

**Description**: Filter/search across journal entries, uni log, exercise history.

**Examples**:
- Journal: filter by type (daily/weekly/insight), date range, keyword search
- Uni Log: filter by module, date range, min/max OTJ hours
- Exercises: filter by exercise name, date range, weight threshold
- Padel: filter by opponent, result (win/loss), date range

**Estimated Effort**: Medium (2-3 days)

---

## 🔮 LOW PRIORITY (Future, nice-to-have)

### 7. Sleep Tracking (Import from Health App)
**Status**: Planned

**Description**: Import sleep data from Apple Health (iOS) or Google Fit (Android) to correlate with mood, energy, and gym performance.

**Why**: Sleep is foundational to energy and mood. Automatic import eliminates manual logging friction.

**Implementation**:
- iOS: HealthKit integration (requires special entitlements, free)
- Android: Google Fit API integration (free)
- Auto-pull last 30-90 days of sleep data
- Store sleep time, wake time, duration, quality score (if available)
- Sync daily or on-demand

**Data Structure**:
```json
{
  "sleep": {
    "2026-03-27": {
      "bedtime": "2026-03-27T23:30:00Z",
      "wake_time": "2026-03-28T07:00:00Z",
      "duration_mins": 465,
      "quality": null // from HealthKit if available
    }
  }
}
```

**UI Changes**:
- Integration setup page (connect HealthKit/Google Fit via OAuth)
- Sleep stats: average hours, trend (7-day, 30-day)
- Dashboard: sleep duration last night + time-to-bed
- Correlation with mood/energy charts

**Estimated Effort**: Medium (2-3 days, mainly API auth + data sync)

---

### 8. Meal Logging & Recipe Suggestions
**Status**: Concept (modified approach)

**Description**: Input list of ingredients on hand; JE OS suggests recipes with brief macro overview + approximate calories per portion (nearest 50). No detailed calorie tracking.

**Why**: ADHD + gamification can create unhealthy tracking behaviours. This approach focuses on practical meal planning + awareness, not obsession. Approximate calories help with portion sense without obsession.

**Features**:
- Ingredient list: user inputs what's available (e.g., "chicken, rice, broccoli, olive oil")
- Recipe suggestions: Claude API or free recipe database (Spoonacular free tier, Edamam free tier)
- Macro overview: "~40g protein, ~45g carbs, ~12g fat per serving"
- **Calorie estimate**: "~450 kcal per portion" (rounded to nearest 50, no precision tracking)
- Dietary notes: Nut-free (auto-filter due to allergies), vegetarian options, etc.
- Meal log: "Made chicken stir-fry" + linked recipe + portion count
- Weekly overview: variety of meals logged

**Why No Full Tracking**:
- Full calorie counting can trigger obsessive patterns
- User profile: ADHD, activation energy issues
- Better to encourage: trying new recipes, variety, mindful eating
- Approximate calories (nearest 50) help with portion awareness without precision obsession

**Data Structure**:
```json
{
  "meals": {
    "meal_id_123": {
      "date": "2026-03-27",
      "recipe_name": "Chicken Stir-Fry",
      "ingredients": ["chicken breast", "rice", "broccoli", "olive oil"],
      "macros": { "protein_g": 40, "carbs_g": 45, "fat_g": 12 },
      "calories_per_portion": 450, // nearest 50
      "portions": 2,
      "notes": "Tasted good",
      "dietary_tags": ["nut_free", "gluten_free"]
    }
  }
}
```

**Integration with Free APIs**:
- Spoonacular API (free tier: 150 calls/day, sufficient for daily use)
- Edamam Recipe Search API (free tier available)
- Both return macros + calories in response

**UI Changes**:
- New "Meals" page
- Ingredient quick-add form (comma-separated or multi-input)
- Recipe suggestion results: image, name, macros, **calories (nearest 50)**, difficulty
- Meal log: date, recipe, portions, notes, save to history
- Weekly summary: variety count, macro ranges, calorie awareness (not tracking)

**Estimated Effort**: Medium (2-3 days, mainly API integration + UI)

---

### 9. Mobile App (Native, Free)
**Status**: Long-term

**Description**: React Native or Flutter app for iOS/Android using free/open-source tools.

**Current State**: PWA (Progressive Web App) is installable and mobile-optimised.

**Why Native App**:
- Better offline support
- Native performance & animations
- Access to device sensors (camera, location, health data)
- Home screen presence on iOS/Android

**Free Options**:
- **React Native** + Expo (free hosting/builds up to a point)
  - Build for iOS/Android from single codebase
  - Expo Go app for free testing
  - EAS Build (paid but free tier available for small projects)
  
- **Flutter** + Firebase (completely free)
  - Single codebase, excellent performance
  - Free deployment via Firebase Hosting
  - No dev licence required for testing (Android)
  
- **Android** (free):
  - No developer licence fee
  - Google Play requires one-time $25 fee (not recurring)
  
- **iOS** (constraint):
  - $99/year Apple Developer Programme required to deploy
  - TestFlight allows free testing on devices without deployment
  - Alternative: Use PWA for iOS (already works well)

**Recommendation**: 
- Start with Flutter + Firebase (completely free, good performance)
- Deploy to Google Play immediately (one-time $25)
- For iOS: Use PWA + TestFlight for testing, evaluate if native app worth $99/year investment
- Data syncs via Firestore, so web/mobile share seamlessly

**Estimated Effort**: Very High (2-4 weeks, depending on feature parity with web)

---

### 10. AI Insights & Coaching (Hybrid Local + Cloud Fallback)
**Status**: Planned (primary: local Ollama, fallback: free Gemini API)

**Description**: Generate personalized insights using local AI by default, with cloud fallbacks when local is offline. Routes: resistance pattern analysis, monthly/yearly reviews, meal suggestions, prompt generation.

**Constraint**: Fully free. Local-first (zero cost), free tier fallbacks only.

**AI Stack** (in order of preference):

1. **GPT-OSS 20B (local, primary)** — Always try first
   - Runs on RTX 5060 Ti with option 4 GPU power save
   - 21B total parameters, 3.6B active per token (MoE)
   - VRAM: ~13.7GB at Q4 quantization
   - Speed: ~42 tokens/sec (instant for dashboard tasks)
   - Cost: £0/month
   - Why: Best reasoning quality, zero latency, always available when PC is on
   - Setup: `ollama pull gpt-oss:20b`

2. **Gemini 2.5 Flash (cloud fallback 1)** — When PC is offline/down
   - Free tier: 10 requests/minute, 1,000 requests/day
   - Quality: Very good (nearly matches o3-mini on benchmarks)
   - Speed: Instant (cloud)
   - Cost: £0/month
   - Why: Higher rate limit than Pro, reliable, good enough for all dashboard use cases
   - Context window: 1M tokens (overkill but useful)

3. **Gemini 2.5 Pro (cloud fallback 2)** — Emergency only
   - Free tier: 5 requests/minute, 1,000 requests/day
   - Quality: Excellent (best Gemini quality)
   - Speed: Instant (cloud)
   - Cost: £0/month
   - Why: Only use if Flash is rate-limited; 5 RPM too tight for regular use
   - Use case: Complex reasoning if Flash fails

**Fallback Logic**:
```javascript
async function askAI(prompt) {
  // Try GPT-OSS first (local)
  try {
    return await ollama('gpt-oss:20b', prompt, { reasoning: 'medium' });
  } catch (e) {
    console.log('Local AI down, trying Gemini Flash...');
  }

  // Try Gemini Flash (cloud)
  try {
    return await gemini('2.5-flash', prompt);
  } catch (e) {
    console.log('Flash rate-limited, trying Gemini Pro...');
  }

  // Try Gemini Pro (last resort)
  try {
    return await gemini('2.5-pro', prompt);
  } catch (e) {
    // All failed—fall back to static content or retry later
    return handleGracefulDegradation(prompt);
  }
}
```

**PC Sleep Mode Strategy** (option 4):
- GPU power save: ~20-25W idle, instant wake
- Ollama always ready when app launches
- If offline for >5 mins, fallback to Gemini automatically
- Reconnect when PC wakes: re-test local availability

**Configuration**:
- Settings page: Show which AI is active (✓ GPT-OSS 20B, ○ Gemini Flash, ○ Gemini Pro)
- Display fallback chain in status indicator
- Show token usage/cost (always £0)
- User can manually override (e.g., force Gemini if testing)

**Implementation Approach**:
- Local-first by default (no configuration needed)
- Graceful degradation: cloud fallbacks happen automatically
- Store which model generated each insight (for reproducibility)
- Log fallback usage (for monitoring PC uptime)

**Use Cases** (all through single AI):
1. **Resistance Pattern Analysis**: 
   - "You've avoided these tasks 5+ times this month: X, Y, Z"
   - Identify common pattern: complexity / discomfort / timing / context
   - Generate: "Smallest first step: [actionable suggestion]"

2. **Monthly/Yearly Review Generation**:
   - Summarize: mood trends, energy patterns, wins, challenges
   - Prompt: "Here's my March data. Generate a 3-minute read on patterns/progress/next month focus."
   - Output: Downloadable markdown document (personal & private)

3. **Meal Suggestion Ranking** (free recipe API + AI ranking):
   - User inputs: "chicken, rice, broccoli, olive oil" + allergies auto-filled
   - Spoonacular/Edamam free API returns 5 recipes + macros
   - Single AI refines: "Recipe A is quickest (15min), fits nut-free needs, good protein."

4. **Journal Prompt Generation**:
   - Instead of static library, generate prompts based on weekly patterns
   - Example: "You've logged high resistance to learning tasks. Reflect on barriers this week."
   - Uses user's own data to personalise prompts

5. **Year-in-Review Summary**:
   - Combine all data from 12 months
   - Generate narrative: "2026 patterns, growth areas, 2027 focus"
   - Downloadable report

**Data Structure**:
```json
{
  "ai_config": {
    "primary": "gpt_oss_20b",  // local
    "fallback_1": "gemini_2_5_flash",  // cloud
    "fallback_2": "gemini_2_5_pro",  // emergency
    "gemini_api_key": "user_configured",  // only needed for cloud fallbacks
    "ollama_host": "http://192.168.X.X:11434"  // local PC IP
  },
  "ai_insights": {
    "resistance_analysis_2026_03": {
      "period": "2026-03",
      "ai_model_used": "gpt_oss_20b",  // which model actually generated this
      "fallback_chain": ["gpt_oss_20b (success)"],  // for monitoring
      "top_avoided_tasks": ["SQL practice", "Code review", "Email admin"],
      "pattern": "Complex/high-cognitive tasks",
      "suggestion": "Start with 10-minute SQL warmup, not full session"
    },
    "monthly_review_2026_03": {
      "generated_at": "2026-03-31T23:59:00Z",
      "ai_model_used": "gemini_2_5_flash",  // fell back to cloud
      "fallback_chain": ["gpt_oss_20b (timeout)", "gemini_2_5_flash (success)"],
      "summary": "...",
      "highlights": [...],
      "next_month_focus": "..."
    }
  }
}
```

**Implementation**:
- No configuration needed for local GPT-OSS (auto-discovers at http://192.168.X.X:11434)
- Optional: user enters Gemini API key in settings for cloud fallbacks (free tier, no credit card)
- JE OS automatically tries fallback chain; user never sees the retry logic
- Store which model generated each insight (for reproducibility + monitoring PC uptime)
- Log fallback chain: if GPT-OSS succeeds, fast path; if it fails, retry with cloud
- All insights stay free—no token counting, no billing

**UI Changes**:
- Settings page: Show AI status indicator
  - ✓ GPT-OSS 20B (local) — if Ollama is running
  - ○ Gemini 2.5 Flash (cloud) — if fallback detected
  - ○ Gemini 2.5 Pro (cloud) — if double fallback detected
- New "Insights" page: monthly reviews, pattern analysis, suggestions
- "Generate this month's review" button (auto-routes through fallback chain)
- Prompt generation: blend AI + static library (configurable ratio)
- Meal suggestions: form → free API results → AI ranking/notes
- Optional: show which AI generated each insight (for transparency + monitoring)

**Cautions** (important for ADHD profile):
- Frame as "your patterns, your insights" — not external judgment
- No peer comparisons (user's self-eval already ~65% driven by peer comparison)
- Encourage introspection, not shame or pressure
- Optional features; user can ignore AI suggestions
- Single AI ensures consistent tone + voice across all insights

**Estimated Effort**: Medium (2-3 days backend function calling + UI + settings)

---

### 11. Data Visualisation Improvements
**Status**: Planned (long-term)

**Description**: Replace simple bar charts with interactive graphs (D3, Recharts, or Plotly).

**Examples**:
- Mood heatmap: interactive hover for daily details
- Phone usage: stacked area chart (daily breakdown)
- Padel: win/loss timeline with opponent ratings
- Gym: strength progression curve per exercise

**Current State**: Simple inline SVG/HTML charts work well; no external library needed.

**When to Consider**: Once data volume exceeds current chart limits or user requests specific visualisations.

**Estimated Effort**: Medium-High (3-5 days)

---

### 12. Habit Stacking / Behaviour Anchoring
**Status**: Concept

**Description**: Link habits to existing routines. "After morning coffee, do 5 min padel drill."

**Why**: Aligns with user's ADHD profile (behaviour-anchored habits work better than willpower-dependent schedules).

**Implementation**: Simple input: "After X, I'll do Y." Daily reminder/checkbox.

**Estimated Effort**: Low-Medium (1-2 days)

---

## 🚀 QUICK WINS — ✅ ALL COMPLETE (2026-03-27)

**Batch 1 (Fastest):**
- ✅ **OTJ Hours to Hours & Minutes** — store as total minutes, display as "3h 45m" with separate inputs (h:mm format, backward compat)
- ✅ **Reading book title autocomplete** — `<datalist>` populated from past titles, real-time suggestions
- ✅ **Gym RPE** (Rate of Perceived Exertion) — 1-10 slider with live display, saves on change
- ✅ **Mood trigger auto-save** — "What caused it?" input field with quick save button

**Batch 2 (Medium):**
- ✅ **Toggle Yesterday's data view** — Arrow button (←/→) in topbar, golden highlight, all setters respect state
- ✅ **Priority archive** — Completed priorities stored by week, shows per-week completion count
- ✅ **Streak reset confirmation** — Reset button (↻) on reading streak with confirm modal, prevents accidental loss

---

## 🔍 API FEASIBILITY CHECKS NEEDED

Before starting high-priority features, verify API availability:

### 1. Notability API
**Status**: TO VERIFY
- Documentation: https://notability.com/api (or check developer portal)
- Requirements: 
  - Free/open access for personal use?
  - OAuth2 authentication available?
  - Can export notes + metadata?
  - Rate limits?
- Fallback: Manual PDF export + parsing if API not accessible

### 2. GoodNotes API
**Status**: TO VERIFY
- Documentation: Check GoodNotes developer resources
- Requirements:
  - API available for third-party integration?
  - iCloud sync integration possible?
  - Metadata extraction (date, title, tags)?
  - Rate limits?
- Fallback: File upload if no API

### 3. OnePlus Watch 3 / Amazfit Helio Health Data Export
**Status**: TO VERIFY
- OnePlus: oHealth API documentation + OAuth access
  - Free tier available?
  - Running data export (date, distance, duration, pace)?
- Amazfit: Amazfit Open API documentation
  - Free tier available?
  - Health data export (sleep, exercise)?
  - OAuth2 or API key?
- Fallback: Manual running/sleep logging if APIs not accessible

**Action**: Research before starting Exercise Tracker + Sleep Tracker features. Can use free tier research tools (Postman, cURL, API explorers).

---

### Current Limitations
1. **Firestore Rules**: Currently allow auth'd read/write. Consider field-level rules (e.g., energy_map read-only to user).
2. **Edit Modal**: Fields are configured per function. Consider centralised schema.
3. **Offline Mode**: UI shows but doesn't save. Could use IndexedDB for local-first sync.
4. **Export Size**: 365 days of data in single JSON. Consider pagination or chunking.

### Testing
- Add unit tests for chart rendering
- Add integration tests for Firestore operations
- Test on low-bandwidth networks (PWA performance)

---

## PRIORITY MATRIX

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Note Import (Notability/GoodNotes API) | High | High | 🔴 HIGH |
| Exercise & Reps Tracker (+ wearable sync) | High | High | 🔴 HIGH |
| Padel Sessions + Matches (merged) | Medium | High | 🔴 HIGH |
| Sleep Import (Health App/Amazfit) | Medium | High | 🟡 MEDIUM |
| OTJ Targets & Breakdown | Low | Medium | 🟡 MEDIUM |
| Correlation Hints | Low | Medium | 🟡 MEDIUM |
| CSV Export | Low-Med | Medium | 🟡 MEDIUM |
| Advanced Filters | Medium | Medium | 🟡 MEDIUM |
| Meal Logging (Recipes + Macros/Calories) | Medium | Medium | 🟡 MEDIUM |
| Energy Map (Daily + Weekly Sync) | Low-Med | Medium | 🟡 MEDIUM |
| Priorities Archive + Weekly Review Link | Low | Low | 🟡 MEDIUM |
| Nutrition Logging | Med-High | Low | 🟢 LOW |
| AI Insights (Single AI, Free) | Medium | Medium | 🟢 LOW |
| Data Viz (D3) | Med-High | Low | 🟢 LOW |
| Habit Stacking | Low-Med | High | 🟢 LOW |
| IndexedDB (Offline-First) | Medium | High | 🟢 LOW |
| Gym/Padel Streaks (Category-level) | Low | Low | 🟢 LOW |

---

## NOTES & CONSIDERATIONS

### ADHD-Friendly Design
All additions should:
- Minimise friction (pre-populated forms, auto-complete)
- Provide immediate feedback (toast notifications, micro-animations)
- Use external accountability (streak display, export backups)
- Avoid willpower-dependent tasks (use behaviour anchoring instead)

### Privacy & Data
- User's data stays in their Firebase project (Firestore + Storage)
- No third-party tracking
- Backups downloadable as JSON (user control)
- Consider Firestore backup automation

### Sports Data Path
Features like Exercise Tracker and Padel Match Tracker directly support Joel's goal of moving into a sports data analyst/scientist role:
- Demonstrates ability to collect structured athletic data
- GitHub portfolio can show analysis: "Built tracking system for personal padel performance; analysed 100+ matches to identify patterns in play style vs. opponent type."
- Connects to SQL skills development (querying this data)

---

## VERSION HISTORY

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-03-27 | Initial release (Today, Review, Energy, Padel, Uni, Journal, Priorities, Stats) |
| 1.1 | 2026-03-27 | Fixes: emoji buttons, phone format, uni log redesign, priorities layout, reading streak |
| 2.0 (planned) | Q2 2026 | Note import, exercise tracker, padel match tracker |

---

## FEEDBACK & REQUESTS

**From Joel (2026-03-27, Round 2)**:
- ✅ Notability/GoodNotes: Option B (API integration, not manual upload)
- ✅ Exercise Tracker: Auto-populate Anytime Fitness Rugeley machines, allow custom additions, add flexibility routine, gym auto-detects category + ticks day
- ✅ Wearable Integration: Pull running from OnePlus Watch 3 / Amazfit Helio, sleep from health app
- ✅ Meal Logging: Approximate calories per portion (nearest 50), no detailed tracking
- ✅ AI Insights: Local-first (GPT-OSS 20B) with cloud fallbacks (Gemini 2.5 Flash → Pro)
- ✅ Reading Logging: Requires both pages AND time (no optional fields)
- ✅ OTJ Hours: Convert to hours + minutes format, add targets + breakdown by module
- ✅ Energy Map: Daily + weekly synthesis (daily tracking, weekly review)
- ✅ Priorities: Archive completed, import into weekly review, show completion %
- ✅ Padel: Merge sessions + matches into single page
- ✅ Offline: Implement IndexedDB for local-first sync
- ✅ Streaks: Gym = weeks with all Push/Pull/Legs + Flexibility; Padel = weeks with matches/sessions; category-level, not main sidebar

**AI Stack Decision (2026-03-27, Round 3)**:
- ✅ Model: GPT-OSS 20B (OpenAI's open-source, MoE 21B/3.6B active)
- ✅ PC Sleep: Option 4 (GPU power save, ~20-25W idle, instant wake)
- ✅ Fallback Order: GPT-OSS 20B (local) → Gemini 2.5 Flash (cloud) → Gemini 2.5 Pro (emergency)
- ✅ Why Flash → Pro (not Pro → Flash): Higher RPM limit (10 vs 5), better reliability as emergency fallback
- ✅ Cost: £0/month (all free tiers)

Recorded in updated roadmap. Ready to start implementation.

---

## 📝 FEATURES DEFERRED (Not Yet Started)

These were identified but deferred in favour of quick wins:

### MEDIUM PRIORITY (1-2 days each):
- Padel Match Tracker UI implementation (merge sessions + matches)
- Yesterday's data view toggle
- Priority archive + completion % tracking
- Import priorities to weekly review context
- Streak reset confirmation

### HIGH PRIORITY (3-5 days each, API feasibility checks needed):
- Note Import Integration (Notability/GoodNotes APIs)
- Exercise & Reps Tracker (wearable APIs for OnePlus/Amazfit)

### AI INSIGHTS (deferred, needs deep focus):
- AI Insights & Coaching (GPT-OSS 20B + Gemini fallback stack)

### LOW PRIORITY:
- Sleep tracking (Health app APIs)
- Meal logging & recipe suggestions (Spoonacular/Edamam APIs)
- Mobile app (Flutter + Firebase)
- Data visualisation improvements
- Advanced filters & search
- Habit stacking / behaviour anchoring
