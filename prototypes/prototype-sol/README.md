# ejuicr — mixing workbench

A disposable, responsive visual prototype. Open `index.html` directly, or serve
this directory:

```sh
python3 -m http.server 4173 --directory prototype-sol
```

Visit http://localhost:4173. No installation, build, database, or app server is
needed. Remove `prototype-sol` to discard it; no application files were changed.

Only section navigation works. All recipe actions are disabled; target values,
ingredient amounts, recipes, and defaults are static examples, not live data.

The visual direction is a restrained, typography-led mixing workbench using the
existing palette from `src/app/globals.css`. The calculator is the focal point,
followed by saved recipes and a preview of existing mixing defaults. No external
assets, custom illustrations, fonts, or libraries are used. The design combines
the build-awwwards-quality-sites art-direction guidance with ponytail's minimal
implementation: native scrolling instead of a motion stack or Three.js. Smooth
anchor scrolling respects reduced-motion preferences; the full demo works
without JavaScript or a network connection.
