# Deploying to Cloudflare Pages

EvalCore is a static SPA (Vite build output only, no server), so it deploys
to [Cloudflare Pages](https://developers.cloudflare.com/pages/) directly —
no tunnel or persistent server needed. `.github/workflows/deploy.yml` builds
and deploys on every push to `main` or any `claude/**` branch, and can also
be run manually from the Actions tab (workflow_dispatch).

- Pushes to `main` deploy to the **production** URL.
- Pushes to any other branch deploy to a **preview** URL for that branch.

## One-time setup (do this before the first push)

1. **Create a Cloudflare API token**: Cloudflare dashboard → My Profile →
   [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → Create
   Token → use the "Edit Cloudflare Workers" template or a custom token with
   **Account → Cloudflare Pages → Edit** permission, scoped to your account.
2. **Get your Account ID**: shown on the right sidebar of any zone's
   Overview page in the Cloudflare dashboard, or via `wrangler whoami`.
3. **Add two repository secrets** (GitHub repo → Settings → Secrets and
   variables → Actions → New repository secret):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. (Optional) **Add a repository variable** `CLOUDFLARE_PAGES_PROJECT` if you
   want a Pages project name other than the default `evalcore-mvp`.

The Pages project itself does not need to be created by hand — the first
`wrangler pages deploy` run creates it automatically under that project
name.

## What the workflow does

1. Checks out the repo and installs dependencies (`npm ci`).
2. Runs the type-check (`npm run lint`) and domain tests (`npm test`) — a
   broken build or failing test never gets deployed.
3. Builds the production bundle (`npm run build` → `dist/`).
4. Runs `wrangler pages deploy dist` for the pushed branch.

## Running it yourself locally

```
npm i -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name=evalcore-mvp
```
