# Security

## What this project promises

The game runs entirely in your browser. No accounts, no tracking, no analytics, no runtime network calls after the page loads. Saves live in your browser's localStorage and never leave your device. These claims are verifiable in this repository: there is no server code to audit because there is no server.

## Reporting

If you find a way the deployed game contacts any external host at runtime, treat it as a serious bug and report it privately first. The same goes for anything that could execute untrusted input: save files and seed-challenge links are parsed data and must never become code.

Open a private security advisory on the repository, or email the maintainer listed in the repository profile. You will get an answer within a week, usually much faster. Please include steps to reproduce.

## Scope notes for contributors

- Save loading and share-link parsing validate against schemas before use. Changes there get extra review.
- Data files are content, not code. A malicious pull request would have to survive schema validation, source checking, and human review; keep it that way by never widening what `data/` can express into executable behavior.
- Build-time tooling (audio generation, image generation) uses API keys from environment variables. Keys never ship, never appear in the repository, and pull requests must not touch key handling without discussion first.
