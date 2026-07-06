# How main becomes criticalwindow.org

The game is a static build, deployed to Cloudflare Pages. There is no server.

1. Every push to `main` runs the CI chain (validate, lint, typecheck, tests, build).
2. A maintainer runs [`scripts/deploy.sh`](../scripts/deploy.sh) after the same gates pass locally.
3. Every build ships a `version.json` (commit, data version, package version). The
   deploy is not considered done until https://criticalwindow.org/version.json serves
   the commit that was just deployed; the deploy script enforces this and fails
   loudly if an edge cache still holds an older build.

Verifying a deployment yourself: fetch [/version.json](https://criticalwindow.org/version.json),
check out that commit, run `pnpm build`, and compare. The Sources screen in the game
shows the same commit and data hash. The `public/_headers` file sets a
Content-Security-Policy of `default-src 'self'` (with inline styles allowed for the
framework's style injection, documented here so nobody has to guess), so the browser
itself refuses requests to any foreign host.
