# JE OS

Personal field-notebook PWA. Live at [joelos.web.app](https://joelos.web.app).

## What’s in here

| File | Role |
|------|------|
| `index.html` | The whole app (UI, Firestore, Auth) |
| `sw.js` | Service worker (push + cache) |
| `manifest.webmanifest` | Install / Home Screen |
| `bg.jpg`, `icon-*.png` | Background + icons |
| `firebase.json`, `.firebaserc` | Hosting + Functions config |
| `functions/` | Cloud Function: energy reminder scheduler |

## Run locally

Serve the repo root (any static server). Example:

```
npx serve -l 4173
```

Open `http://127.0.0.1:4173`.

## Ship

Needs the Firebase CLI, logged in, project `joelos`.

```
git push origin main
firebase deploy --only hosting
```

Functions only when that folder changes:

```
firebase deploy --only functions
```

Never commit the Admin SDK key. It lives outside this repo and is gitignored.
