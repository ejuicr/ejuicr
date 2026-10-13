# Deployment and operations

Operational notes for the ejuicr deployment. Last updated: October 2026.

## Production

- App: <https://ejuicr.jimfarrugia.com>
- Host: Mothership Compose/Traefik, accepted and cut over 2026-10-13. Production
  MongoDB remains in Atlas; staging and local MongoDB hosting are separate follow-ups.
- Repo: `github.com/ejuicr/ejuicr`, branch `master`, owned by the `ejuicr`
  organisation; Jim is its sole owner/operator/contributor. CI publishes tested images;
  host deployment is manual and explicitly approved, not triggered by a source push.
- Node.js is pinned to `22.x` via `engines` in `package.json`.
- Vercel's former production project is paused and Git-disconnected, not deleted.
  `https://ejuicr.vercel.app` returns `503 DEPLOYMENT_PAUSED`, not a redirect. Its
  project/credentials/callbacks are retained for separately approved recovery.

## Continuous integration

`.github/workflows/ci.yml` runs on pushes to any branch and on pull requests
to `master`: lint, typecheck, the unit/component suite, the database-backed
integration suite (MongoDB service container, test-only credentials), the
production build, and the Firefox smoke suite. The job is named `Validation`.

**Transition not yet activated:** the existing `master validation` ruleset still
requires `Validation` before a commit reaches `master`. Until the approved ruleset
change, use `scripts/push-gated.sh` (authenticated `gh`) to push a temporary branch,
wait for validation, then push the same commit to `master`. Keep the helper until
that transition is complete; it is not the intended long-term workflow.

After activation, develop/commit normally and run `git push origin master`.
CI owns testing; no PR or local pre-push test gate is added. Only the required
`Validation` restriction will be removed; force-push/deletion protections remain.

Vercel no longer deploys source pushes: its project Git connection is removed.

The `Container image` job runs only on `master` pushes after `Validation`
passes. It builds a linux/amd64 image, smoke-tests it without production services,
then publishes `ghcr.io/<owner>/<repo>:sha-<commit>` using the repository-scoped
`GITHUB_TOKEN`. The workflow summary and job output report the exact published digest.

The prepared `Production deployment` job depends on successful publication and runs
only for `master` pushes with `MOTHERSHIP_DEPLOY_ENABLED=true`. It is not activated:
the dedicated host identity/key and GitHub configuration passed setup-only,
non-deploying checks on 2026-10-13, and the activation variable remains `false`.
Workflow publication does not grant standing deployment authority. After separately
approved activation, `scripts/deploy-mothership.sh` sends that digest and
commit to a restricted Mothership SSH command with pinned host-key verification.
The host serializes rollouts, skips superseded commits, verifies the image revision,
waits for health/HTTPS checks and restores the prior image on failure. Workflow/job
concurrency never cancels an in-progress rollout. No production environment bundle
is supplied to GitHub; only an app-specific deployment key is required.

Failed validation cannot publish or deploy, and production stays unchanged. A later
passing commit deploys its complete snapshot, including earlier failed changes unless
corrected/reverted. Failed deployment is reported by Actions even if rollback succeeds;
host recovery never restores stale database data. Passing CI/HTTP checks do not prove
all database/OAuth/mail flows. Host setup, selection records and recovery are owned by
Mothership's `apps/ejuicr/README.md` automatic-deployment pilot section and ticket 007.

Offline deployment checks: `shellcheck scripts/deploy-mothership.sh`,
`python3 scripts/test-deploy-mothership.py`, and `actionlint .github/workflows/ci.yml`.
The CI Validation job runs the SSH-client check without keys or network access.

Set repository **variables**, not secrets, for the intended public build values:
`NEXT_PUBLIC_DONATION_LINK`, `NEXT_PUBLIC_SUPPORT_EMAIL`, and
`NEXT_PUBLIC_FEEDBACK_EMAIL`. Missing values hide the corresponding UI features.
The initial values were compared with Vercel before cutover; runtime environment
changes cannot replace values already compiled into the client bundle.

The repository has been renamed from `ejuicr-next` to `ejuicr`. Image paths derive
from `GITHUB_REPOSITORY`, so future publications target `ghcr.io/ejuicr/ejuicr`.
The original tested image was published under `ghcr.io/ejuicr/ejuicr-next`; current
production uses a verified post-rename publication under the new path. Verify package
visibility/access and source-repository association for each package before updating
host image references. New GHCR packages default to private even for a public source
repository; public image access avoids a host pull credential but requires an
explicit package visibility change. Until activation, Mothership's `image.env` owns
the selected digest; after activation its root-owned deployment state owns selections.

## Mothership deployment

Production moved to Mothership on 2026-10-13. Mothership's `apps/ejuicr/README.md`
owns host configuration, updates and recovery; its resolved ticket
`docs/work/tickets/resolved/006-ejuicr-production-hosting.md` retains scoped approval
and acceptance evidence. Staging hosting and local MongoDB are deferred separate work.
Keep the paused Vercel project and old callbacks until separately approved cleanup.

Runtime credentials are in root-owned mode-0600
`/srv/mothership/secrets/apps/ejuicr/runtime.env`, under root-owned mode-0700 app-secret
directories. Jim confirms encrypted-vault copies. Never paste resolved environments,
cookies or reset links into chat, logs or Git.

The Dockerfile uses Node 22 and enables Next's standalone output with
`NEXT_OUTPUT_STANDALONE=1`; ordinary Vercel/local builds keep `next start` support.
`.dockerignore` excludes
environment files, local dependencies and build/test artifacts. Never pass runtime
credentials as build arguments. An isolated local build and signed-out smoke test:

```sh
docker build --platform linux/amd64 -t ejuicr:local .
bash scripts/test-container.sh ejuicr:local
```

Pass the three `NEXT_PUBLIC_*` build arguments when preserving the production UI
settings. The smoke test starts only a disposable non-root container, without host
ports or real database/OAuth/mail credentials, and removes that exact container.
It checks the homepage, a static asset and signed-out API denial; it does not prove
database access, authenticated flows, TLS or reverse-proxy client-IP handling.
The host uses a reviewed digest, non-root UID/GID 1000, read-only root filesystem,
temporary writable `/tmp` and `/app/.next/cache`, and runtime-only credentials.
Production cookies require HTTPS and `APP_URL` must be the selected hostname.
The root layout uses request-time rendering so Google/X button availability reflects
runtime credentials, not the secret-free build environment. Container smoke supplies
dummy OAuth credentials only at runtime and checks the resulting provider flags.

## Environment mapping

| Environment       | Database             | `APP_URL`                     |
| ----------------- | -------------------- | ----------------------------- |
| Local development | `ejuicr-development` | `http://localhost:3000`       |
| Mothership Production | `ejuicr-production` | `https://ejuicr.jimfarrugia.com` |
| Vercel Production (paused) | `ejuicr-production` | optional (see below) |
| Vercel Preview (inactive) | `ejuicr-staging` | not needed (uses `VERCEL_URL`) |

All three databases live in the same free Atlas M0 cluster
(`ejuicrcluster.m6bqbpe.mongodb.net`). Free-tier characteristics that matter:
512 MB storage, ~100 ops/sec, 500 connections, **no automated backups**, and
the cluster auto-pauses after 30 days with zero connections.

The recorded Atlas Network Access setting is `0.0.0.0/0`, originally for Vercel's
non-static egress; hosting cutover did not change access or database privileges.
Least-privilege credentials/access changes and credential rotation require a
separate scope; no rotation was performed during this hosting cutover.

`APP_URL` is optional on Vercel: `getAppUrl()` in `src/lib/url.ts` falls back
to `VERCEL_PROJECT_PRODUCTION_URL` (stable production domain) and
`VERCEL_URL` (previews), then the request origin. It is still used for
password reset links and OAuth redirect URIs.

## Environment variables

Core (required): `MONGODB_URI`, `JWT_SECRET`.

Required for the features they enable:

- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — Google sign-in (hidden when
  unset).
- `TWITTER_CONSUMER_KEY` + `TWITTER_CONSUMER_SECRET` — Twitter sign-in
  (hidden when unset).
- `EMAIL_ADDRESS` + `EMAIL_PASSWORD` — password reset emails. Without them,
  reset requests fail; email/password sign-in still works.
- `NEXT_PUBLIC_DONATION_LINK` — donation link on Contribute (the section is
  hidden when unset).
- `NEXT_PUBLIC_SUPPORT_EMAIL` / `NEXT_PUBLIC_FEEDBACK_EMAIL` — mail links on
  Help and Contribute (email text is omitted when unset).

`APP_URL` is optional on Vercel (see above); set it to the externally
reachable URL when hosting elsewhere.

- Local values are in git-ignored `.env.local`; production values are in Mothership's
  private runtime file. Vercel settings are retained for recovery, not active deployment.
- `NEXT_PUBLIC_*` values are inlined at build time — set them before the
  build or redeploy afterward.
- Any Vercel env change needs a new deployment to take effect.
- `JWT_SECRET` must be a long random string (`openssl rand -base64 32`).
  Rotating it signs out every session. Session versioning also revokes old
  tokens whenever a password is set or changed.

## OAuth

### Google

- Existing OAuth client in Google Cloud project number `916930895724`, under the
  Google account that owns the
  `ejuicr-server`, `ejuicr-server staging`, and `ejuice-server development`
  projects.
- Authorized redirect URIs:
  - `https://ejuicr.jimfarrugia.com/api/auth/google/callback`
  - `https://ejuicr.vercel.app/api/auth/google/callback`
  - `http://localhost:3000/api/auth/google/callback`
- Flow: OAuth 2.0 authorization code, implemented in
  `src/lib/oauth/google.ts` and `src/app/api/auth/google/`.
- Console path: <https://console.cloud.google.com/auth/clients> (the older
  "APIs & Services → Credentials" page also works).
- Google can take 5 minutes to a few hours to apply redirect URI changes.
- A stale client from project `42289256841` exists in an old `.env` but
  belongs to an account we cannot access. **Do not use it.**

### X (Twitter)

- OAuth 1.0a via the `twitter-api-v2` package; implementation in
  `src/lib/oauth/twitter.ts` and `src/app/api/auth/twitter/`.
- Identify the app in the X developer portal by matching its **API Key**
  with `TWITTER_CONSUMER_KEY`.
- Callback URIs:
  - `https://ejuicr.jimfarrugia.com/api/auth/twitter/callback`
  - `https://ejuicr.vercel.app/api/auth/twitter/callback`
  - `http://localhost:3000/api/auth/twitter/callback`
- "Request email from users" must be enabled; the app rejects sign-in
  without an email (`authError=twitter-email`).
- If sign-in fails, `/api/auth/twitter` redirects to `/?authError=twitter`.
  To see X's exact error, call `generateAuthLink` locally with the callback
  URL; X's XML error message is logged by the route.

### Email

- Gmail SMTP over port 465 (`EMAIL_ADDRESS` + app password in
  `EMAIL_PASSWORD`). Vercel allows ports 465/587 and blocks only port 25.
- Verify credentials without sending mail via `transporter.verify()`.
- Password **reset** sends email; changing a password while signed in
  never does.

## Known quirks

- **Authentication and data invariants**: read `docs/DECISIONS.md` before
  changing auth, session, password, or uniqueness behavior.
- **Local dev DNS**: the LAN router (`192.168.50.1`) has a stale negative
  cache for the Atlas SRV record (from when the cluster was paused), so
  `querySrv ENOTFOUND` is returned even though public DNS resolves it. Fix
  by flushing/restarting the router DNS or using `1.1.1.1`/`8.8.8.8` on the
  dev machine. Temporary workaround: run a module that calls
  `dns.setServers(["1.1.1.1", "8.8.8.8"])` and start dev with
  `NODE_OPTIONS="--import /path/to/module.mjs" npm run dev`.
- **npm audit**: the five high advisories are a single dev-only chain
  (`eslint-config-next → fast-glob → micromatch → braces`,
  GHSA-vfj7-8cjw-p6xm) with no patched release. `npm audit --omit=dev`
  reports zero. Never run `npm audit fix --force` (it downgrades
  `eslint-config-next` to v14 and breaks the Next 16 lint setup).
- **Old infrastructure**: the old `ejuicr-server` backend and Vite front end
  are retired. The old backend had been down for 30+ days (proven by the
  Atlas auto-pause) and its GitHub Actions self-hosted runner is gone.
  Cleanup was deliberately skipped; nothing depends on it. The retired front
  end is still deployed at <https://ejuicr.netlify.app>: backend-dependent
  pages fail, but the calculator remains usable as a visual reference for UI
  parity. Update or remove this note if that deployment is taken down.

## Verification after any change

Run all of these locally:

```
npm run lint
npm run typecheck
npm test
npm run test:integration   # in-memory MongoDB, or set MONGODB_TEST_URI
npm run build
```

`npm run test:integration` creates and drops its own temporary database; it
starts an in-memory MongoDB by default, or uses the isolated server in
`MONGODB_TEST_URI` when set. Never point that variable at development or
production. CI supplies a local MongoDB service container.

Then smoke-test production:

1. `GET /api/user/me` → 401 when signed out.
2. Register → `/api/user/me` → delete a throwaway account (201/200/200).
3. `GET /api/auth/google` → redirects to `accounts.google.com` with client
   project `916930895724` and the production callback.
4. `GET /api/auth/twitter` → redirects to `api.x.com` with an
   `oauth_token` and sets the request-token cookie.
5. In a browser: Google + X sign-in, save/view a recipe, settings
   persistence, change password, and password reset email end-to-end.

Read-only duplicate audit (exit code 2 means duplicates were found):

```
node --env-file=.env.local scripts/inspect-duplicates.mjs --database ejuicr-production
```

It also accepts `--database ejuicr-staging`. The audit covers recipe titles,
settings documents, and duplicate Google/Twitter provider IDs. Unique partial
indexes on `googleId`/`twitterId` (excluding empty and missing values) are in
the schema and are built by Mongoose on the first connection; run this audit
against any restored or migrated data before expecting the indexes to build.

## Backup and restore

Atlas M0 has **no automated backups**, so the maintainer owns a manual
routine. This section is the procedure, not an automated system: nothing here
runs on a schedule by itself.

- **Owner:** the maintainer (Jim Farrugia).
- **Cadence:** weekly, and before any risky migration or data change.
- **Storage:** gzipped `mongodump` archives in a directory outside the
  repository (for example `~/backups/ejuicr/`), on an encrypted disk. Never
  commit a dump.
- **Retention:** keep the eight most recent weekly archives (about two
  months). Delete older archives only after the new dump has been written
  successfully and verified as non-empty.
- A weekly dump also opens a connection, which helps prevent the free
  cluster's 30-day idle auto-pause.

### Weekly backup

Requires the MongoDB Database Tools (`mongodump`) locally and cluster access.
On Arch, install the AUR package `mongodb-tools`, or unpack the official
Linux tarball from <https://www.mongodb.com/try/download/database-tools> and
put its `bin` directory on `PATH`.

The current database user has `readWriteAnyDatabase`, so it can create the
temporary restore database below. If that user is narrowed to the three
ejuicr databases, grant it access to the check database or restore into a
local MongoDB instead.

`.env.local` uses dotenv syntax, not shell syntax, and can contain characters
that break `source`. Extract the production URI with Node instead:

```sh
PROD_URI=$(node --env-file=.env.local -e \
  "console.log(process.env.MONGODB_URI.replace('/ejuicr-development','/ejuicr-production'))")
mkdir -p ~/backups/ejuicr
STAMP=$(date +%F)
mongodump --uri="$PROD_URI" --gzip \
  --archive="$HOME/backups/ejuicr/ejuicr-production-$STAMP.archive.gz"
```

Export staging the same way by replacing the database name. If the URI is
not based on `ejuicr-development`, substitute the cluster host and
credentials from `MONGODB_URI` manually.

### Restore check (quarterly, or after changing this procedure)

Restore the latest production archive into an isolated temporary database on
the same cluster, verify it, then drop the temporary database:

```sh
mongorestore --uri="$PROD_URI" --gzip \
  --archive="$HOME/backups/ejuicr/ejuicr-production-$STAMP.archive.gz" \
  --nsFrom="ejuicr-production.*" \
  --nsTo="ejuicr-restore-check-$STAMP.*"
node --env-file=.env.local scripts/inspect-duplicates.mjs \
  --database "ejuicr-restore-check-$STAMP"
```

Drop `ejuicr-restore-check-$STAMP` afterwards. `readWriteAnyDatabase` can
drop collections but not databases, so either drop the database in the Atlas
UI (project owner) or drop its collections without installing `mongosh`:

```sh
node --env-file=.env.local --input-type=module -e "
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI.replace('/ejuicr-development', '/ejuicr-restore-check-$STAMP'));
const db = mongoose.connection.db;
for (const collection of await db.listCollections().toArray()) {
  await db.dropCollection(collection.name);
}
await mongoose.disconnect();
"
```

The check is successful when the restore completes, the audit runs against
the restored database, and the document counts look plausible. Record it
below; the table must contain real checks, not planned dates.

| Date | Source archive | Restored database | Result | Verified by |
| ---- | -------------- | ----------------- | ------ | ----------- |
| 2026-10-05 | `ejuicr-production-2026-10-05.archive.gz` | `ejuicr-restore-check-2026-10-05` | 4 documents restored, 0 failures; duplicate audit clean (0 duplicate titles, settings, emails, or provider IDs) | Jim |

A full disaster recovery (restoring over `ejuicr-production` with
`mongorestore --drop`) is destructive and requires the maintainer's explicit
approval at the time.

## API compatibility

JSON field names deliberately match the legacy Express API (`_id`,
`base.pg`, `ingredients.nicotine`, ...). Existing data in the three
databases therefore works unchanged; do not rename fields in the models or
route responses without a migration plan.
