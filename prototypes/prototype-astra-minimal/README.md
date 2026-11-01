# ejuicr · Astra minimal

A disposable visual prototype using the existing dark palette and logo, system fonts, and plain HTML/CSS. A small script switches between static views and updates navigation, focus, and page titles. No dependencies, API calls, storage, calculations, or CRUD.

## Preview

Open `index.html` directly in a browser, or run from the repository root:

```sh
python3 -m http.server 4178 --bind 127.0.0.1
```

Visit <http://127.0.0.1:4178/prototype-astra-minimal/>.

Values are read-only and action buttons are disabled. Navigation links and disclosures work. All quantities are illustrative, not mixing instructions.

## Views

- `index.html`: calculator; `index.html#recipe`: saved recipe example.
- `views.html`: saved recipes, settings, account, sign in, sign up, password reset/update/set, about, help, contribute, privacy, terms, and not found.
- The footer’s **Prototype views** disclosure links to authentication and empty/error page examples. Account and recipe disclosures show static deletion/removal confirmations.

The prototype presents fictional signed-in data; authentication links only navigate between examples. Optional environment-specific email and donation links are omitted. Informational copy is drawn from the current app; legal text is retained as a visual sample.

## Visual direction

- One compact workspace: target on the left, aligned ingredients on the right.
- A single-column phone layout, with 44px or larger controls.
- Cyan links, primary buttons, and focus indicators, with muted navigation and stepper controls. Existing purple, pink, and yellow give ingredients subtle identifiers alongside their names.
- Quiet borders and typography instead of decorative dashboards or oversized branding.

Delete this directory to discard the prototype. The only external local asset is `../public/logo.svg`.

## Prototype smoke check

With the preview server above running, execute from the repository root:

```sh
node prototype-astra-minimal/check.mjs
```

Uses the repository’s existing Playwright/Firefox installation to check every view at phone and desktop widths, navigation history, static controls, and disclosures.
