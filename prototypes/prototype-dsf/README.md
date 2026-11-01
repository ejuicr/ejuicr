# ejuicr UI prototype (disposable)

Open `index.html` in a browser. This is a static visual concept: the calculator,
CRUD, authentication, and persistence are not wired up. Navigation between pages,
the signed-in state, and the auth screens are visual only.

Included: Calculator, Recipes, Recipe detail, Settings, My Account, About, Help,
Contribute, Privacy, Terms, and the sign-in / sign-up / reset-password flow.
Sign out to see the signed-out Calculator page; its sign-in links open the auth
screen, and submitting the sign-in form returns to the signed-in Calculator view.

It lives outside `src/` and is not part of the Next.js build. Contact addresses,
sample account data, and the donation action are placeholders. Delete this
folder when it has served its purpose.
