# JE OS

A personal field-notebook PWA: one place to log the day. This repo is a **template**. Point it at **your** Firebase project — it is not a public product and it does not link to anyone else’s live instance.

Public preview (no live data): **https://joel-e7.github.io/JoelOS/**

## What’s in here

| File | Role |
|------|------|
| `index.html` | The whole app (UI, Firestore, Auth) |
| `sw.js` | Service worker (push + cache) |
| `manifest.webmanifest` | Install / Home Screen |
| `bg.jpg`, `icon-*.png` | Background + icons |
| `firebase.json`, `.firebaserc` | Hosting + Functions config |
| `functions/` | Optional Cloud Function (reminders) |
| `docs/` | Static template preview for GitHub Pages |

## Use it as your own

1. Fork or clone.
2. Create a Firebase project (Auth + Firestore + Hosting).
3. Replace the Firebase config object in `index.html` (and `sw.js` if you use push).
4. Put your own Admin SDK key **outside** the repo. Never commit it.
5. Serve locally, then `firebase deploy --only hosting` from your account.

```
npx serve -l 4173
```

Accounts: turn off public registration in Firebase Auth if this is just for you (and maybe one other person). Add extra users in the Firebase Console → Authentication → Users.
