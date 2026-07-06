# Security

## What this project promises

The game runs entirely in your browser. No accounts, no tracking, no analytics, no telemetry, and no requests to any third-party host, ever. To be exact about the network: after the first load, the only requests the app can make are for its own static files on the same origin (the optional music and narration load lazily the first time you enable sound, then cache for offline play). The static host serves files and keeps ordinary access logs like any web server; nothing the game does sends your choices, saves, or anything else anywhere. Saves live in your browser's localStorage and never leave your device.

These claims are auditable in this repository: there is no server code because there is no server, the service-worker config lists exactly what is cached, and the Sources screen in the game shows the build's data-version hash so you can check a deployment against this repo. A Content-Security-Policy header restricts the app to its own origin at the browser level.

## Reporting

If you find a way the deployed game contacts any external host at runtime, treat it as a serious bug and report it privately first. The same goes for anything that could execute untrusted input: save files and seed-challenge links are parsed data and must never become code.

Open a private security advisory on the repository, or email hello@criticalwindow.org. You will get an answer within a week, usually much faster. Please include steps to reproduce.

## Scope notes for contributors

- Save loading and share-link parsing validate against schemas before use. Changes there get extra review.
- Data files are content, not code. A malicious pull request would have to survive schema validation, source checking, and human review; keep it that way by never widening what `data/` can express into executable behavior.
- Build-time tooling (audio generation, image generation) uses API keys from environment variables. Keys never ship, never appear in the repository, and pull requests must not touch key handling without discussion first.
