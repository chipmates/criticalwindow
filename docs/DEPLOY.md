# How main becomes criticalwindow.org

The game is a static build, deployed to Cloudflare Pages.

1. Every push to `main` runs the CI chain (validate, lint, typecheck, tests, build).
2. A maintainer deploys with `wrangler pages deploy dist --project-name=criticalwindow`
   after the same gates pass locally. There is no server; the deploy is a folder of files.
3. `criticalwindow.org` is the canonical home; `criticalwindow.pages.dev` is the same
   deployment under the host's default name.

Verifying a deployment against this repository: the Sources screen in the game shows the running build's commit and its data-version hash (the hash covers all game data; the commit pins the code). Check out that commit, run `pnpm build`, and compare. The `public/_headers` file sets a Content-Security-Policy of `default-src 'self'`,
so the browser itself refuses any request to a foreign host, which makes the
no-external-calls promise enforced rather than merely claimed.
