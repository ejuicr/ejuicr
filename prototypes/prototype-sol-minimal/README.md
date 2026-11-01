# ejuicr UI prototype

Disposable, standalone visual demo. Open `index.html` directly in a browser, or serve this folder:

```sh
python3 -m http.server 3200 --directory prototype-sol
```

Visit <http://localhost:3200>. Calculator, My recipes, and About navigation works; everything else is deliberately static. Fields are read-only and mutation buttons are disabled. Recipe links all show the same sample mix. No API calls, storage, dependencies, external assets, or application changes.

Colors are copied from `src/app/globals.css`. Layout adapts to narrow screens, with visible keyboard focus and labeled fields. The existing `/prototype` was not consulted or modified.

With the server running, check navigation and responsive layouts using the repository's existing Playwright dependency and Firefox installation (`npm run test:e2e:install` if needed):

```sh
node prototype-sol/smoke.mjs
```
