# Stage Detail — sequential source-matching QA

Date: 2026-10-04 (Asia/Seoul)
final result: passed

Scope of pass: reference fidelity review and local UI integration. The manufacturing PNG fallback has a known native-resolution limitation, documented below; this report does not claim 4K output or lossless raster zoom.

The user rejected the batch SVG recreation and subsequent stylization. The replacement workflow was one stage at a time: measure the original PNG, reproduce its layout, compare equal-scale captures, repair differences, and then integrate that stage. All nine stages have now been reviewed. This is an implementation/self-QA result, not an assertion of user approval.

## Current application state

- **Spec through Tapeout:** sixteen source-matched SVGs are integrated, with embedded normal-width Roboto and actual SVG geometry/text. No raster image is embedded in any of these sixteen files.
- **Fab / Package / Test:** two image-model-regenerated PNGs are integrated under the user's explicit fallback authorization. The SVG trials lost too much of the reference's equipment surfaces and bond-wire appearance.
- **Original PNG references:** all eighteen remain intact. Rejected manufacturing vectors, obsolete batch font tooling, and unused draft fonts were moved out of the project to the temporary QA archive.
- The earlier copy deletions are preserved. Interactive 3D source is unchanged.

## RTL visual truth and evidence

- Full mock: `design-mockups/stage-detail/02-rtl.png`.
- Illustration references: `assets/stage-detail/rtl-overview.png` and `assets/stage-detail/rtl-detail.png`.
- The SVG follows the actual reference coordinates, rather than applying a shared decorative card design. Overview viewBox: `0 88 1647 777`; detail viewBox: `0 113 2020 541`. These match the existing PNG presentation crop exactly.
- Typeface: embedded normal-width Roboto, with regular body text and bold titles. Condensed display type, glossy blue badges, bevels, and added decorations from the rejected SVG batch are absent from this stage.
- Source/implementation comparison uses the same PNG crop and exact pixel width; no independent scaling or aspect-ratio distortion was introduced.
- Chromium captures and comparisons live in `C:/Users/tbdk5/AppData/Local/Temp/chipbook-svg-qa/`: `rtl-overview-reference-v2.jpg`, `rtl-detail-reference-v2.jpg`, `rtl-overview-reference-comparison.jpg`, `rtl-detail-reference-comparison.jpg`, and `rtl-reference-page-v2.jpg`.

## RTL findings and repairs

1. Rejected batch: incorrect text width, excessive detail-scene height, invented badge styling and material effects. Rebuilt the stage from measured original geometry and reference typography.
2. First matched draft: the long `rst_n` label approached the panel boundary. Corrected label placement, reduced the overview label size, and captured v2.
3. Original illustration clock/reset crossings were kept as separate electrical nets; no false junction dots were introduced.

### Required fidelity surfaces

- Typography: normal text width, reference-sized titles and body labels; self-contained font data; no text outside the SVG frame (71 labels checked).
- Spacing/layout: four original scene columns, matching crop and overall aspect; module, waveform, datapath and register-map locations measured from the PNG.
- Color: restrained pale-blue fills, dark navy wires/text, light dashed group boundaries, and pale numbered circles match the reference direction.
- Image quality: actual SVG shapes/text with no embedded raster image; sharp browser rendering and intact data/clock/port paths.
- Copy/content: all four RTL scenes, top hierarchy, register map, and English labels retained. Previously removed Korean UI helper copy remains absent.

## Final integration checks

- Clean app preview: `http://127.0.0.1:8794/index.html`. Direct stage entry: `http://127.0.0.1:8794/pages/page-2-flow/02-stage-detail.html#stage=rtl`.
- Desktop at 1536 × 1024 and mobile at 390 × 844: all nine stage tabs, all eighteen image loads, and all eighteen overview/detail dialogs verified at each size. Frame document width equals its scroll width; no page-level horizontal overflow.
- Tablet at 1024 × 900: app and chapter widths remain contained.
- Mobile RTL detail region: 287px visible width, 760px scroll content. ArrowRight moved its scroll position while the RTL stage remained selected.
- Keyboard stage navigation changed RTL → DV → RTL; Escape closed the dialog and restored focus. The semantic close button also passed at the default 1.5 device-pixel ratio.
- Existing 3D transitions passed for manufacturing/Test and Physical Design/Routing. Canvas dimensions were nonzero; both stages were returned to their diagram views.
- Raster zoom now caps image width by native pixel width / devicePixelRatio. Verified limits at DPR 1.5: 1110.67 CSS px for the manufacturing overview, 1384 CSS px for the detail. SVG dialogs clear this limit.
- Browser measurement of 547 SVG text labels: zero outside the SVG frame. Eleven font-em-box intersections were adjacent intentional multiline labels; their visible glyph spacing was reviewed in the source comparisons and did not require layout changes.
- SVG XML/dimensions, all referenced markers/gradients/clips, embedded fonts, and absence of raster `<image>` nodes passed. The eighteen HTML asset references resolve to sixteen SVGs and two regenerated PNGs.
- Previous copy requests remain complete: nine `단계별 핵심 과정` headings, removed scene-count helpers and takeaways, and twenty-seven INPUT/PROCESS/OUTPUT headings without the deleted Korean side labels.
- `python tools/build_site.py --check`, `node --check assets/stage-detail.js`, Python parsing of the vector generator, and `git diff --check` passed.
- The browser log contains the pre-existing root/Overview-page MutationObserver error and CDN dependency warnings seen before Stage Detail opened. This report does not claim an entirely clean application console; no new diagram-loading or dialog failure was observed.

Integration evidence in the temporary QA directory: `final-integrated-desktop.json`, `final-integrated-mobile.json`, `final-native-dpr-check.json`, `final-vector-text-audit.json`, `final-rtl-mobile.jpg`, `final-rtl-integrated-zoom.jpg`, `final-rtl-integrated-page.jpg`, `final-manufacturing-3d.jpg`, and `final-physical-3d.jpg`.

## Spec inspection

- Reproduced the original four unframed detail scenes, pastel category colors, SoC hierarchy, and PPA triangle. Overview viewBox `0 98 1665 782`; detail `0 101 2017 581`.
- Corrected the overview transition arrow stacking and the area-icon spacing during equal-scale browser comparison.
- Both images load at the intended dimensions in the stage page. Evidence: `spec-{overview,detail}-reference-v2.jpg`, `spec-{overview,detail}-reference-comparison.jpg`, `spec-reference-page-v2.jpg` in the temporary QA directory noted above.

## DV inspection

- Reproduced the five-block verification loop and four original process panels, including waveform values, debug annotation, and coverage bins. Overview viewBox `0 103 1666 775`; detail `0 44 2076 647`.
- Corrected the small DUT pin count, document icon proportions, response-label clearance, and panel-title colors during comparison.
- Both SVGs load at their intended dimensions in the stage page. Evidence: `dv-{overview,detail}-reference-v2.jpg`, `dv-{overview,detail}-reference-comparison.jpg`, `dv-reference-page-v2.jpg`.

## Synthesis inspection

- Overview viewBox `0 63 1665 814`; detail `0 33 2073 672`. Original gate diagrams, monospace code, library, optimization and timing panels retained.
- Fixed a crowded Before label; separated clock/data nets and corrected the active-low reset condition in the illustrated RTL.
- Browser evidence: `synthesis-{overview,detail}-reference-v2.jpg`, comparisons, and `synthesis-reference-page{-detail,}-v2.jpg`. Full-width CDP capture uses device pixels, normalized uniformly for source comparison.

## DFT / PI inspection

- Overview viewBox `0 82 1666 789`; detail `0 41 1991 734`. Source-specific blue rounded-number badges, scan muxes, two power domains, clock mode selector and connectivity checks retained.
- Repaired tight scan arrows near continuation dots, source header positions, and each LS/ISO path arrow. Independent FF outputs are not shorted together.
- Browser text bounds have no SVG-frame overflow. Both images load at the intended dimensions. Evidence: `dft-{overview,detail}-reference-v2.jpg`, comparisons and stage-page top/detail captures.

## Physical Design inspection

- Overview viewBox `0 3 1666 930`; detail `0 61 1983 693`. Measured fixed macro locations, IO pads, standard-cell rows and floorplan-to-routing progression reproduce the source composition.
- Adjusted route density/clock emphasis, the different overview/detail die outlines, and long input/output descriptions to fit their source boxes.
- Both images load at the intended dimensions. Evidence: `physical-{overview,detail}-reference-v2.jpg`, comparisons and stage-page top/detail captures. Comparisons uniformly normalize 1.5x browser device-pixel images to the original width.

## Signoff inspection

- Overview viewBox `0 5 1665 938`; detail `0 91 2017 661`. Source STA, DRC/LVS, IR/EM, approved release items and dashed failure-to-ECO return path are retained.
- Refined the routed-layout texture and EM trace density and increased the last checklist label's clearance from its check icon.
- Both assets passed source comparison and live page review. Evidence: `signoff-{overview,detail}-reference-v2.jpg`, comparisons and stage-page top/detail captures.

## Tapeout inspection

- Overview viewBox `0 195 1665 564`; detail `0 41 2171 624`. Preserved the nine-layer stack, document icon, versioned folder stack, foundry and photomask perspective.
- Strengthened metal-layer pattern strokes, corrected the chip icon fill and checklist icon, and replaced overly simple mask spirals with the source's circuit-like tile shapes and subtle reflections.
- Both assets passed source comparison and live page review. Evidence: `tapeout-{overview,detail}-reference-v2.jpg`, comparisons and stage-page top/detail captures.

## Manufacturing fallback and limitation

- Built-in image generation reproduced `manufacturing-overview.png` and `manufacturing-detail.png` as project-local `manufacturing-overview-generated.png` and `manufacturing-detail-generated.png`. Original files were not overwritten.
- Actual output dimensions: **1666 × 944** and **2076 × 757**. The tool retained approximately the reference size despite a second overview request and an explicit 4096px request. A 4K/native-resolution increase was **not achieved**. No conventional resizing is presented as new detail.
- Exact final prompt, input roles, output paths, mode and actual dimensions are recorded in `assets/stage-detail/manufacturing-generation.json`.
- Existing PNG crop framing remains at 1666/486 and 2076/646. Actual page load and dialog enlargement were checked, including the native-pixel display cap.
- Evidence: `manufacturing-reference-page-v1.jpg`, `manufacturing-reference-page-detail-v1.jpg`, `manufacturing-reference-zoom-v1.jpg`, plus the final integrated desktop/mobile and default-DPR results.
