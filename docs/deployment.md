# Deployment and configuration

Application-level guidance for development and deployment. Host-specific access,
credentials, backup cadence and recovery procedures belong in the operator's
infrastructure documentation, not this public repository.

## Continuous integration

`.github/workflows/ci.yml` validates branch pushes and pull requests: lint,
typecheck, unit/component tests, database-backed integration tests, production
build and Firefox smoke tests. Integration tests use a disposable MongoDB service
with test-only credentials, never a development or production database.

Normal `master` pushes, including documentation-only pushes and PR merges, can
publish and automatically deploy the exact tested container image after successful
validation. Branch/PR validation does not deploy. Wait for **Validation → Container
image → Production deployment**; validation alone does not prove deployment.
Superseded commits can finish green without replacing the running image. Failed
validation/publication leaves the prior deployment unchanged; image rollback never
restores database data. Host, credential and database changes require separate
operator authorization. Do not push documentation changes implicitly.

The image is published for linux/amd64 under the repository's GHCR path; use the
reported immutable digest for deployment. Public source does not automatically
make a newly published GHCR package public. Verify image access before rollout.

## Local development database

Use a database and identity intended for development, not production. A private
`.env.local` supplies `MONGODB_URI`; it does not establish network access. For an
operator-hosted database, ask the operator for workstation authorization, verified
SSH connection details, the database-scoped development credential and the private
connection procedure. Do not reuse a CI deployment key or another device's private
key. Database authentication and SSH authentication are separate.

For a new checkout, copy `.env.example` to `.env.local`; for an existing checkout,
edit the existing file without overwriting other settings. Restrict it to your user
and confirm it is ignored by Git:

```sh
chmod 600 .env.local
git check-ignore .env.local
```

For a database reached through an operator-approved local SSH tunnel, the URI uses
the tunnel's workstation loopback address and local port. Placeholder example:

```dotenv
MONGODB_URI=mongodb://<development-user>:<url-encoded-password>@127.0.0.1:<local-port>/<development-database>?authSource=<authentication-database>
APP_URL=http://localhost:3000
```

Use the authentication database supplied by the operator. For a loopback
`MONGODB_URI`, `npm run dev` reuses a tunnel already listening on the URI's port,
or opens one through the workstation's operator-provided `mothership` SSH alias
and closes it when the dev server stops. Missing or invalid SSH access fails with
an error instead of starting without database access. GUI tools can use the same
local endpoint and scoped credential. Never expose the local tunnel to other
machines. Shared development
data is not disposable test data: coordinate changes and clean up only your named
test records. Development credentials must not grant production access.

Use a development-only `JWT_SECRET` and optional integration credentials, never a
production environment bundle. Missing OAuth credentials hide their sign-in buttons;
email/password sign-in works without mail credentials, but password reset needs
SMTP configuration. Check database authentication, not just a listening tunnel,
using the operator's procedure before accepting a new workstation.

Integration tests create and drop temporary databases. They use in-memory MongoDB
by default; `MONGODB_TEST_URI`, if set, must select an isolated test server, never
the development or production server. Changing a URI's database name does not
grant access to another database.

## Environment variables

Core (required): `MONGODB_URI`, `JWT_SECRET`.

Required for the features they enable:

- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — Google sign-in.
- `TWITTER_CONSUMER_KEY` + `TWITTER_CONSUMER_SECRET` — X sign-in.
- `EMAIL_ADDRESS` + `EMAIL_PASSWORD` — password reset emails.
- `NEXT_PUBLIC_DONATION_LINK` — donation link on Contribute.
- `NEXT_PUBLIC_SUPPORT_EMAIL` / `NEXT_PUBLIC_FEEDBACK_EMAIL` — Help/Contribute links.

Set `APP_URL` to the externally reachable URL when self-hosting. On Vercel,
`src/lib/url.ts` can use `VERCEL_PROJECT_PRODUCTION_URL` or `VERCEL_URL`, then
the request origin. The URL is used for reset links and OAuth callbacks.

`NEXT_PUBLIC_*` values are public and inlined at build time; runtime changes cannot
replace them. Set them before building. A long random `JWT_SECRET` is required
(`openssl rand -base64 32`); rotating it signs out all sessions. Session versioning
also revokes old tokens when a password is set or changed.

Never commit resolved environments, credentials, database dumps, cookies, reset
links, account records or private infrastructure details. Keep runtime secrets out
of build arguments, command-line arguments and shared logs. `.env.local` uses
dotenv syntax, not shell syntax; do not `source` it.

## Container deployment

Node.js is pinned to `22.x` in `package.json`. The Dockerfile enables Next.js
standalone output with `NEXT_OUTPUT_STANDALONE=1`; ordinary local/Vercel builds
retain `next start` support. `.dockerignore` excludes environment files, local
dependencies and build/test artifacts.

An isolated local build and signed-out container smoke test:

```sh
docker build --platform linux/amd64 -t ejuicr:local .
bash scripts/test-container.sh ejuicr:local
```

Supply the three `NEXT_PUBLIC_*` build arguments to preserve intended public UI
settings. The smoke test uses a disposable non-root container, no real services
or credentials, and removes only that container. It checks homepage/assets and
signed-out API denial, not database access, OAuth, mail, TLS or proxy handling.

Supply secrets only at runtime. Use HTTPS for production cookies and the correct
`APP_URL`. The root layout renders provider availability from runtime credentials;
container smoke tests use dummy OAuth values to check these flags. Operator
documentation owns reverse-proxy, networking, persistent storage and rollout policy.

## OAuth and mail

### Google

- OAuth 2.0 authorization code flow: `src/lib/oauth/google.ts` and
  `src/app/api/auth/google/`.
- Register `{APP_URL}/api/auth/google/callback` in the approved Google OAuth client,
  including `http://localhost:3000/api/auth/google/callback` for local development
  when authorized.
- Client configuration is at <https://console.cloud.google.com/auth/clients>.
  Redirect changes can take minutes to hours. Do not reuse retired credentials
  without operator verification.

### X (Twitter)

- OAuth 1.0a via `twitter-api-v2`: `src/lib/oauth/twitter.ts` and
  `src/app/api/auth/twitter/`.
- Register `{APP_URL}/api/auth/twitter/callback`, including the localhost equivalent
  when authorized. Identify the developer-portal app by its API key privately.
- Enable "Request email from users"; absent email is rejected with
  `authError=twitter-email`. General sign-in failure redirects with
  `authError=twitter`. Keep provider diagnostics private.

### Email

- Gmail SMTP uses port 465 and an app password. Verify configuration without
  sending mail with `transporter.verify()`.
- Password reset sends mail; changing a password while signed in does not.

## Verification

Read `docs/DECISIONS.md` before changing authentication, sessions or uniqueness
invariants. For application/runtime changes:

```sh
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
```

Documentation-only changes need diff/link/example checks, not the application
suite. After an authorized runtime change, verify signed-out `/api/user/me` denial,
named disposable account/recipe/settings workflows, configured OAuth callbacks
and password reset as appropriate. Coordinate production writes with the operator;
remove only the named disposable records. CI/HTTP checks do not establish every
authenticated flow.

Read-only duplicate audit against the development URI in `.env.local`:

```sh
node --env-file=.env.local scripts/inspect-duplicates.mjs
```

Exit code 2 means duplicates; output may include account/recipe details and must
stay private. The audit covers recipe titles, settings and provider IDs. A restored
or migrated database audit requires its own authorized scoped connection, not
production access inferred from development credentials. Unique partial provider
indexes exclude empty/missing values; audit existing data before expecting new
indexes to build.

## Backup and recovery

The operator's infrastructure documentation owns consistent capture, encrypted
credential custody, cadence, retention and isolated restore verification. A
standalone database dump or a non-empty archive does not prove recovery. Protect
both durable application data and matching runtime/database credentials; never
commit either to this repository.

Test restores in isolated disposable targets and compare captured documents and
indexes, not merely document counts. Do not restore over production, delete state,
switch to a stale database or retry an uncertain backup without explicit operator
authorization. Image rollback is not database recovery. Backup age and off-site
protection must be established by actual operations, not inferred from this guide.

## API compatibility

JSON field names match the legacy Express API (`_id`, `base.pg`,
`ingredients.nicotine`, ...). Do not rename model/response fields without a
migration plan.
