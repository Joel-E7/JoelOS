# JE OS Multi-Provider AI Abstraction Guide

## Overview

JE OS now supports swapping between multiple AI providers (Google Gemini, Anthropic Claude, OpenAI, Kimi) without changing any application code. The abstraction layer decouples the app logic from provider-specific API formats.

**Zero friction:** Switch providers in Settings, update your API key, and all chats automatically route to the new provider.

---

## Architecture

### Core Components

**1. PROVIDERS object** (lines ~5075)
```javascript
const PROVIDERS = {
  google: { ... },
  anthropic: { ... },
  openai: { ... },
  kimi: { ... }
};
```

Each provider declares:
- `name` — Display name (e.g., "Google Gemini")
- `endpoint` — Base API URL
- `models` — Fast and deep model identifiers
- `normalizeMessages(msgs)` — Convert `{ role, content }` to provider format
- `buildRequest(messages, maxTokens, thinkingLevel)` — Construct the HTTP request
- `parseResponse(data)` — Extract text from API response
- `keyParamName` — Where to put API key (URL param, header name, etc.)

**2. State Variables**
- `_activeProvider` — Current provider name (default: 'google')
- `_providerKey` — Cached API key for active provider (cleared on provider/key changes)

**3. Helper Functions**
- `getAIProvider()` — Fetch active provider from Firestore, cache in `_activeProvider`
- `getProviderKey()` — Fetch API key from `user_data/provider_keys[activeProvider]`
- `setAIProvider(providerName, apiKey)` — Change active provider and save config

**4. Main Entry Point**
- `askAI(messages, maxTokens, thinkingLevel)` — Universal AI call
  1. Reads `_activeProvider` and `_providerKey`
  2. Looks up `PROVIDERS[activeProvider]`
  3. Normalizes messages (Gemini format → Claude format, etc.)
  4. Builds request with correct auth
  5. Sends HTTP request
  6. Parses response (extract `candidates[0].content.parts[0].text` for Gemini vs `choices[0].message.content` for OpenAI)
  7. Returns `{ text, error? }`

---

## How to Add a New Provider

### Step 1: Get the API Docs
Gather:
- API endpoint URL
- Model names (fast + deep variants)
- Request/response JSON format
- Authentication method

### Step 2: Add to PROVIDERS

```javascript
kimi: {
  name: 'Kimi (Moonshot)',
  endpoint: 'https://api.moonshot.cn/v1/chat/completions',
  models: { fast: 'moonshot-v1-8k', deep: 'moonshot-v1-32k' },
  
  normalizeMessages: (msgs) => msgs.map(m => ({
    role: m.role,
    content: m.content
  })),
  
  buildRequest: (messages, maxTokens, thinkingLevel) => {
    const model = thinkingLevel === THINK.DEEP 
      ? PROVIDERS.kimi.models.deep 
      : PROVIDERS.kimi.models.fast;
    return {
      model,
      url: PROVIDERS.kimi.endpoint,
      body: {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: thinkingLevel === THINK.FAST ? 0.2 : 0.7
      },
      headers: { 'Content-Type': 'application/json', 'Authorization': '' }
    };
  },
  
  parseResponse: (data) => {
    if (data.error) throw new Error(`API error: ${data.error.message}`);
    return data.choices?.[0]?.message?.content || 'No response';
  },
  
  keyParamName: 'Authorization' // Header: Authorization: Bearer {key}
}
```

### Step 3: Test
1. Settings page → Provider dropdown → Select your new provider
2. Paste API key in the input → Save
3. Click "Test connection" button
4. If it returns "✓ Connected", you're done

---

## Data Storage

### Firestore Locations

**`user_data/ai_config`** — Current active provider
```json
{
  "provider": "google"  // or "anthropic", "openai", "kimi"
}
```

**`user_data/provider_keys`** — Per-provider API keys
```json
{
  "google": "AIzaSyDxxx...",
  "anthropic": "sk-ant-xxx...",
  "openai": "sk-xxx...",
  "kimi": "sk-xxx..."
}
```

**Backward Compatibility:** `settings/ai.key` (old location) is checked first in `getAIKey()`. If found, used instead of new system. No migration required — old keys still work.

---

## Settings UI

The Settings page now includes:

1. **Provider Selector** — Dropdown with all providers
   - Shows active provider
   - Displays fast + deep model names for that provider

2. **API Keys Section** — Per-provider input cards
   - Status indicator (✓ Set / ○ Not set)
   - Input field with masked placeholder
   - Save / Delete buttons
   - Link to each provider's API key page
   - Test button (non-destructive, shows result overlay)

---

## Cost Optimization

You can now test models and switch to cheaper options without rewriting code.

### Example Scenarios

**Scenario 1: Google's rates go up → Switch to OpenAI**
1. Get OpenAI API key at platform.openai.com/api-keys
2. Settings → API Keys → OpenAI section → Paste key → Save
3. Settings → Provider Selector → OpenAI
4. Done. All chats now use `gpt-4o-mini` (cheaper) instead of Gemini Flash

**Scenario 2: New model release → Test before committing**
1. Update `PROVIDERS.google.models.deep` to new model name (e.g., `gemini-3.0-flash`)
2. Settings → Test your Google key
3. If it works, keep it. If not, revert the model name.

**Scenario 3: Hybrid cost optimization**
- Omnibar (THINK.FAST) routes to cheap model (Phi 3.5, Gemma)
- Ask JE OS (THINK.DEEP) routes to powerful model (Claude Opus)
- Same provider, different model tiers per thinking level

---

## Caching Still Works

`askAICached()` hashes the prompt and checks `ai_saves` before any API call. Works across all providers — if you log a meal, cache the result, then switch to OpenAI, the cached response is reused (no duplicate cost).

---

## Error Handling

`askAI()` returns:
```javascript
{ text: "..." }              // Success
{ error: 'no_key', text: "Add your ... API key in Settings first" }
{ error: 'config', text: "Unknown AI provider: xyz" }
{ error: 'network', text: "Network error: ..." }
{ error: 'api', text: "API error: ..." }
```

Callers check `res.error` and handle gracefully (toast, UI fallback, etc.).

---

## Thinking Levels (still the same)

- `THINK.FAST` (0) → Temperature 0.2, fast model → Omnibar, parsing
- `THINK.NORMAL` (1) → Temperature 0.7, fast model → Regular chat, coaching
- `THINK.DEEP` (2) → Temperature 0.7, deep model → Ask JE OS, summaries

Each provider has a fast + deep variant. You can update these independently per provider as new models release.

---

## Future Extensions

**Self-hosted models:** Add a `local` provider that POST's to `http://localhost:11434/api/generate` (Ollama). Changes needed:

1. Add to PROVIDERS:
```javascript
local: {
  name: 'Local (Ollama)',
  endpoint: 'http://localhost:11434/api',
  models: { fast: 'phi3.5', deep: 'mistral' },
  // ... normalizeMessages, buildRequest, parseResponse
}
```

2. Settings page detects localhost, warns about connection, tests with "ping" endpoint
3. That's it. All chats route to your local LLM.

**Cost tracking:** Log each API call to `ai_calls` collection with provider, model, tokens, cost. Build a dashboard on Settings page.

**Model benchmarks:** Store latency + quality metrics per provider, suggest swaps if new model is both cheaper and faster.

---

## Code Locations

- **Provider definitions**: Lines ~5075–5170
- **State variables**: Lines ~5171–5180
- **Helper functions**: Lines ~5182–5225
- **askAI()**: Lines ~5227–5280
- **Settings page**: Lines ~6012–6070
- **Settings handlers**: Lines ~6072–6130 (changeAIProvider, saveProviderKey, etc.)
- **getAIKey() backward compat**: Lines ~5063–5078

---

## Minimal Test

Add this to any chat to verify the provider system works:

```javascript
const res = await askAI([{ role: 'user', content: 'What provider am I using?' }], 100, THINK.FAST);
console.log('Response:', res.text);
console.log('Provider:', _activeProvider);
```

---

## Troubleshooting

**"Add your X API key in Settings first"**
- You selected a provider but didn't paste an API key
- Go to Settings → API Keys → Find that provider → Paste key → Save

**"Network error: ..."**
- API endpoint URL might be wrong (check PROVIDERS[provider].endpoint)
- API key format wrong (some need `Bearer` prefix, some don't)
- CORS issue (test endpoint in a terminal with curl first)

**"API error: ..."**
- Provider returned an error (invalid key, rate limit, region block, etc.)
- Check browser DevTools → Network tab → see the actual response

**Test button shows connection success but chats fail**
- Your key works but something else is wrong (model name deprecated, region restriction, etc.)
- Test with a simple prompt in DevTools console: `await askAI([{ role: 'user', content: 'hi' }], 50)`

