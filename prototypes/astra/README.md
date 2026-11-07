# Astra UI prototypes

Throwaway UI study: which of three layouts best fits ejuicr's existing calculator and account flows?

```sh
npm --prefix prototypes/astra run dev
```

Open http://localhost:3103. Uses the repository's installed Next.js and React; no additional install needed.

- `/?variant=A` — Workbench: persistent sidebar, input workspace and sticky results.
- `/?variant=B` — Worksheet: horizontal navigation and one flat, sequential sheet.
- `/?variant=C` — Split: results first, with a separate input column.

The floating prototype bar switches variants, and its **Views & states** menu previews all screens and less common states. Left/right arrow keys cycle variants outside form controls. The **State** disclosure shows in-memory inputs and session state. The bar is development-only.

All mutations are in memory. Reload resets the demo. Email sign-in accepts any valid demo email and nonempty password; signup and password changes use the existing password policy. Google/X buttons simulate returning from the provider. No real authentication, email, database writes, or storage. Calculator results and password validation reuse the current app's pure functions. The logo is served directly from `public/logo.svg`.

## Coverage

Calculator (guest and signed in), nicotine and flavor carrier configuration, add/remove flavor, inline save/update/rename, invalid mixture, saved recipes with title/date sorting and deletion, empty/loading/error recipe states, missing recipe, settings and all existing defaults, account, linked-provider removal and last-method protection, set/change password, delete account, sign in, sign up, reset request, reset confirmation, reset-link form/expiry/success, provider error, signed-out return, About, Help, Contribute, Terms, Privacy, and not found.

Recipe list entries use only the existing list endpoint's title and updated date. Provider buttons represent the existing optional integrations. Help/Contribute use the public X/GitHub links; environment-dependent support email/donation links are omitted when unconfigured. There is no light theme.

## Review status

Variant A (Workbench) is approved for implementation on `ui-rebuild`. It is the
design reference; variants B and C are not required for implementation or further
review. Keep the prototype separate from the production implementation: its
authentication and mutations are simulated.

Implement the shared shell and calculator first, then recipes, settings, account,
authentication and informational pages. Preserve the existing production APIs,
calculator behavior and authentication rules. The existing About, Help and
Contribute page copy must remain unchanged; apply the new design without replacing
their text with the prototype copy.

## Verification

- Existing app: lint (other prototype directories excluded), typecheck, 230 unit/component tests, 13 integration tests, production build, and 11 Firefox smoke tests passed.
- This prototype: production build and production browser smoke passed, including original assets and the hidden review bar.
- Firefox: all 27 preview views in all three variants checked at 1440, 390 and 320 pixels, with no horizontal overflow, missing images or browser errors. Desktop and mobile screenshots reviewed.
- Exercised calculation updates, carrier edits, save/rename/delete, settings, unit preferences, zero nicotine, guest draft retention through sign-in/out, signup validation, password recovery, provider-only protection, password setup, unlinking, account deletion and keyboard variant switching.

These are prototype smoke checks; authentication and writes remain simulated.
