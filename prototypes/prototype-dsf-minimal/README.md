# ejuicr prototype — dsf-minimal

Disposable static visual prototype for a quieter, modern ejuicr interface.
The existing dark-only palette from `src/app/globals.css` is reused; no other
prototype was used as a reference.

## View it

Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 4173 --directory prototype-dsf-minimal
```

Then visit <http://localhost:4173>. The small **Screens** control in the header
opens a list of every demo page. It is prototype chrome, not part of the design,
and is hidden on phones where the normal app navigation already reaches every
screen.

## Screens

- Calculator and saved-recipe variants
- Recipes list with sort state and delete confirmation
- Settings (units, defaults, zero-nicotine switch, nicotine/flavor defaults)
- My Account (profile, linked accounts, password, delete account)
- Sign in, sign up, reset password
- About, help, contribute, terms, privacy

## Not included

This is a layout and style demo, not an implementation. The calculator does not
calculate, forms do not submit, and no recipe, account, or settings data is
saved. No UI is designed for features that do not exist in the current build.
