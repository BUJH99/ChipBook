Stage Detail 3D

Editable source: src/features/stage-detail/index.mjs
Runtime: assets/features/stage-detail/stage-detail-3d.bundle.js
Build declaration: src/app/asset-builds.json
Vendor inputs: src/vendor/three/ (Three.js 0.160.0, MIT)
Runtime license: assets/features/stage-detail/THREE-LICENSE.txt

Install the locked build tools once with npm ci.
Run python tools/dev.py build after editing the source or vendor inputs.
Run python tools/dev.py check to detect any stale generated output without rewriting it.

The classic IIFE supports direct file preview and HTTP hosting. It loads after
selecting a 3D view. Inactive and out-of-viewport viewers stop rendering.

Physical Design: fixed macro positions, cell placement, clock tree, routing layers.
Fab / Package / Test: wafer, package assembly with exploded view, production test fixture.
These are explanatory concept models, not an EDA or manufacturing simulation.
