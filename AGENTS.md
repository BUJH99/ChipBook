# ChipBook development

- This is a static site; preserve both HTTP hosting and direct `index.html` preview.
- Edit chapter content in `pages/<chapter>/source/sections/`. The `pages/*.html`
  files and root `index.html` are generated; run `python tools/dev.py build`.
- Chapter order and section labels belong to `src/app/page-registry.json`.
  Display numbers are independent from stable page IDs: the practice bank and
  exam are chapters 27/28 with legacy IDs `page-13`/`page-14`. Preserve
  `sectionAliases` when moving or renaming a section.
- Use `title` for the full section name and optional `tocTitle` for a shorter
  navigation label. Compile `{{section:key:toc}}` / `{{section:key:label}}`
  tokens into chapter markup; do not duplicate labels in page JavaScript.
- Document metadata and page-specific dependencies belong to each
  `pages/<chapter>/source/page-build.json`; reuse `src/templates/page-head.html`.
- Declare ordered `scripts`, structured `headScripts`, and dynamic `runtimeAssets`
  in the page manifest. Content fragments must not load scripts themselves.
  Live UVM documents remain standalone runtime inputs with their own document head.
- Shared page navigation and iframe sizing live in `assets/guidebook-page-common.js`.
  Optional feature bundles register with `GuidebookPage.registerInitializer` and
  are loaded only by the pages that need them. Do not add question data or
  page-specific simulations back to the common runtime.
- Repeating work must use `GuidebookPage.registerLifecycle` so section changes,
  chapter changes and browser visibility stop timers and pending actions. Use
  `registerViewportFeature` for lazy 3D viewers. Child iframe documents report
  their own height; do not rewrite child styles while observing their mutations.
- Reuse `.guidebook-section-head`, `.guidebook-section-shell`,
  `.guidebook-section-kicker`, `.guidebook-chapter-head`, `.card` and `.modern-table`
  before introducing per-chapter copies. Keep page-specific CSS and JS in
  `assets/pages/`, reusable visuals in `assets/components/`, and optional features
  in `assets/features/`.
- Bundle entries and outputs are declared in `src/app/asset-builds.json`.
  Shared curriculum models/renderers live in `assets/features/curriculum/source/`.
  Lesson HTML is ordinary authored content; `.artifacts/` migration helpers are
  not normal build dependencies. Downloadable examples live in `assets/examples/`;
  the build creates their deterministic ZIP link in memory for HTTP/file parity.
  Edit the bus chapter's `assets/pages/page-8-on-chip-bus/source/` and `styles/`,
  memory operations in `assets/features/memory/source/`, and stage 3D source in
  `src/features/stage-detail/`. Their generated JS/CSS must be rebuilt, not edited.
  Build-only vendor lives in `src/vendor/`; runtime packaging follows
  `src/app/runtime-assets.json` and preserves licenses.
- All mockups, prompts, generated images used only as references, screenshots,
  reports, logs, one-off scripts and build packages go under `.artifacts/`.
  Put final, referenced runtime images in `assets/` and track them in Git.
  Never create root-level concepts, `output/`, `design-mockups/`, or copied debug pages.
- UVM section documents are live iframe inputs, not obsolete duplicates. Their
  manifest declares `runtimeFiles`, which the deployment packager includes.
- After edits run `python tools/dev.py check` and the relevant existing tests with
  `python tools/dev.py test`. For UI changes verify the affected section, navigation,
  and a narrow viewport in a real browser; record evidence in `.artifacts/qa/`.
- Run `npm ci` when setting up the repository or changing the lockfile. Browser
  tests use `python tools/dev.py setup-browser` once, then `python tools/dev.py test-browser`.
  Cover HTTP and direct-file preview when changing shared runtime or packaging.
- Preserve pre-existing user changes. Do not delete content solely because it is
  hidden by default or has a name such as `mock` (the mock exam is a real feature).
