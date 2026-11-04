# ejuicr — modern UI prototype

Throwaway design prototype for a modern ejuicr UI. Three directions live in one
small in-memory app so the same screen can be compared across all three.

**Not production code.** No backend, no database, no persistence. Mutations
(save recipe, delete, password, account, sign-in) only change browser memory and
reset on reload. The auth flow is a demo.

## Run it

Open `index.html` directly, or serve the directory:

```sh
python3 -m http.server 4173 --directory prototype-skill-dsf
```

Then open:

- http://localhost:4173/?variant=A
- http://localhost:4173/?variant=B
- http://localhost:4173/?variant=C

Use the floating bar or the `←` / `→` keys to switch. The switcher is review
chrome and would not ship.

## Shared direction

All three use the existing ejuicr logo, the existing dark palette and the
existing gradients:

- ink `#15171b`, surface `#21222c`, muted `#414558`, cream `#f8f8f2`
- cyan `#8be9fd`, green `#50fa7b`, orange `#ffb86c`, pink `#ff79c6`,
  purple `#bd93f9`, red `#ff5555`, yellow `#f1fa8c`
- primary gradient: purple → cyan
- hover gradient: pink → purple
- heading gradient: yellow → pink

No light themes. No serif fonts. The existing logo is used in every header and
in the footer.

Navigation is a desktop sidebar in all three directions, and a sticky bottom
navbar on mobile. There is no hamburger menu. The sign-in/sign-out flow is
visible from the sidebar, the mobile top bar and the account page.

Calculator results are lists, not headed tables. Units sit next to every value,
for example `Propylene glycol 19% 5.7mL 5.91g`.

## The three directions

### A — Ledger

The layout from the first pass, rebuilt dark. A fixed mixing-ledger sidebar,
Bebas Neue display headings, a target/flavors column and a sticky batch sheet.
The sheet is the primary reading surface. Recipes are an editorial index.

**Bet:** ejuicr is a quiet utility; make it feel like a trusted mixing notebook.

### B — Instrument

The dense workbench layout from the first pass, with larger labels and
subheadings for readability. Target and save panels sit on the left; a live
readout with a segmented fill bar and inline-unit ingredient list sits on the
right; flavor inputs run underneath.

**Bet:** frequent mixers want density and precision, but the instrument still
has to be legible.

### C — Pour

A new direction. A narrow icon rail, an oversized poster-like batch hero, a
vertical bottle that fills with the nicotine/PG/VG/flavor mix, a three-part
target ribbon, a two-column ingredient grid and open flavor rows. No cards, no
table, no mix-card grid.

**Bet:** ejuicr can be a graphic, tactile mixing canvas rather than a form.

## What is covered

Everything maps to behaviour that exists in the current app:

- calculator target, nicotine strength, amount, PG/VG ratio
- nicotine base configuration (strength, PG/VG)
- flavors: name, percentage, PG/VG base, add/remove
- live ingredient amounts with both / volume / weight units
- impossible-formula error state and disabled save
- save recipe, update recipe, recipe title
- guest calculator with sign-in prompt on save
- recipes list with last-updated / title sorting and delete confirmation
- settings: units, target defaults, zero nicotine mode, nicotine defaults,
  flavor defaults
- demo email sign-in/sign-up/password reset, Google/X sign-in, sign out
- account: profile, recipe count, linked accounts, unlink, set/change password,
  delete account
- About, Help, Contribute, Terms, Privacy

No new product features were invented. There is deliberately no recipe search,
tagging, sharing, batch scaling, inventory, community or cost calculator, none
of which exist in the current build. The existing app is dark-only, so no light
theme control was added.

The recipe list only shows name and updated date because that is all the list
endpoint returns. Sample recipes are local fixtures.

## Sign-in / sign-out demo

The prototype starts signed in. Use the sign-out icon in the sidebar (desktop)
or top bar (mobile), or the button on the Account page. After signing out, use
the Sign in button in the same place, then try Google, X, or email. The account
page demonstrates set-password/change-password and unlinking providers.

## Useful prototype states

- `?variant=A|B|C` — design direction
- `?signedout=1` — start signed out
- `?page=recipes|settings|account|about|help|contribute|terms|privacy`
- `?page=signin|signup|reset` — auth screens
- `?signedout=1&page=signin` — auth screen directly

## Known prototype omissions

- No real auth, API or database; all data is local fixtures.
- No loading skeletons, network-error states, OAuth failure notice or 404 page.
- Profile images use initials rather than remote provider photos.
