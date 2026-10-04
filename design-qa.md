# Chapter 5-1 Memory Fail Mechanisms — implementation QA

Date: 2026-10-04 (Asia/Seoul)
Final result: **passed for the new failure-mechanism experience**.

Selected design: Option 2, `design-mockups/page5-fail-mechanisms/normal-fault-comparison.png`.
The prior Stage Detail report is preserved at `design-mockups/stage-detail/design-qa.md`.

## Deliverables

- All 16 mechanism mockups, plus the additional DRAM Soft-mode view, were completed before application implementation began.
- The 16 main source PNGs are 1582 × 994; the additional Soft-mode source is 1580 × 995. Their SHA-256 values still match the pre-implementation `all-mechanisms/manifest.json`.
- The gallery is `design-mockups/page5-fail-mechanisms/index.html`; every image links to its original PNG.
- The application is integrated into Chapter 5-1, with generated main and debug pages rebuilt from their source fragments.
- `implementation-desktop.png` is an actual browser capture of the completed UI, not a generated mockup.
- Structured browser evidence is in `design-mockups/page5-fail-mechanisms/qa/`. Detailed captures and reference comparisons are in `C:/Users/tbdk5/AppData/Local/Temp/chipbook-fail-qa/`.

## Coverage

DRAM: Retention Fail, Restore Fail, Sense Margin, Row Hammer, Refresh Fail, Write Recovery, Variable Retention Time, and Hard / Soft Error. Hard and Soft have separate event and recovery behavior.

SRAM: Read Upset, Write Fail, Half-select Disturb, Hold Fail, Slow Bit, Mismatch / RTN, Aging, and Soft Error / SEU.

All cases use matched normal/vulnerable panels, synchronized conceptual waveforms, five phase stops, playback/pause/replay, 0.5×/1×/1.5×/2× speed selection, timeline seeking, phase controls, mitigation comparison, circuit enlargement, and cause/state/result explanations. No autoplay is used; leaving the lesson or hiding the document stops playback.

## Reference fidelity and technical corrections

Each of the 17 mockup views was reviewed against a browser-rendered counterpart. The selected design's blue/white palette, two-cell comparison, shared waveform/player, three explanation blocks, and mitigation strip are preserved. The existing book header and navigation retain their real dimensions; this is not a claim of pixel-for-pixel matching of the generated application shell.

The circuits use native interactive SVG. Their signals, nodes, charge indicators, moving markers, displayed status, and waveform cursor share one sampled state. The generated bitmaps remain design references; they are not flattened UI surfaces.

Corrections found during visual/behavioral QA:

- Changed retention and aging plots to overlaid normal/vulnerable curves; used a shared stimulus row where it clarifies the sequence.
- Fixed CSS paint precedence that initially hid active signal colors and moving markers.
- Rebuilt Half-select as two readable cell columns, with the write-target cell staying correct while the adjacent unselected cell can fail.
- Rebuilt Slow Bit around a stored-cell block, paired bitlines and a differential sense amplifier. Stored data remains valid even when the sample is invalid.
- Rebuilt Aging at full circuit size, with Fresh as the initial reference and an explicit Stressed device annotation. Its axis represents cumulative stress.
- Separated sense-enable painting from WL activity.
- Kept the original hard defect visible after spare-cell remapping and routed activity through the spare path.
- Distinguished ECC-corrected output from stored data and the later Scrub rewrite, including the interval during the rewrite.
- Moved the zoom dialog below the parent book's floating table-of-contents control; verified both pointer close and Escape.
- Reflowed the mobile player so the play control remains circular and its label does not collapse.

Generated reference inaccuracies were corrected where needed: a partial DRAM restore need not immediately flip data; a missed SRAM timing sample is displayed as unconfirmed instead of inventing a fixed wrong bit; RTN and aging margin loss do not force a fabricated upset; a spare row does not physically heal an open connection; ECC correction and Scrub are separate steps. Five phase labels were normalized across cases. The diagrams are conceptual equivalents, not transistor-level SPICE simulations.

## Verification

| Check | Result |
| --- | --- |
| Pure model: 16 lessons, 34 comparison modes, 401 samples per mode | Passed |
| Finite/bounded state values and shared waveform/circuit samples | Passed |
| Mechanism-specific terminal and recovery invariants | Passed |
| Browser switching and terminal failure/improvement checks: 16 cases plus Soft mode | Passed |
| Actual 0.5× playback, pause stability, replay, and completed 2× playback | Passed |
| Timeline Home/End/ArrowRight, phase previous/next, waveform click seek | Passed |
| Pausing when the lesson scrolls offscreen | Passed |
| Zoom pointer close, Escape, and mobile close control | Passed |
| Integrated desktop: 1582 × 994 | No page/frame horizontal overflow |
| Integrated tablet: 1024 × 900 | No page/frame horizontal overflow |
| Integrated mobile: 390 × 844; all 16 mechanism selections | No page/frame horizontal overflow |
| Narrow-screen circuit and waveform horizontal scrolling | Passed; keyboard moved circuit scrollLeft from 0 to 120 |
| Local Pretendard font and Tabler icon loading | Passed; no broken icons in the lesson |
| Gallery: 17 loaded source images and link to standalone implementation | Passed |
| `node tools/test_memory_fail_model.cjs` | Passed |
| JavaScript syntax checks | Passed |
| `python tools/build_site.py --check` | Passed |
| `git diff --check` | Passed; existing LF/CRLF notices only |

Screenshots were taken through the browser screenshot API. The desktop viewport was 1582 × 994; the capture service returned 1567 × 985 pixels. Reference-comparison detail crops are width-normalized and were used for qualitative fidelity review, not a claimed pixel-error score. Temporary wrong-DPR/cropped diagnostic captures are not final evidence.

The standalone lesson produced no JavaScript errors during QA. The integrated book still reports its pre-existing Overview/MutationObserver error and Tailwind/Three.js CDN warnings. They were present before this change and did not prevent the new lesson's interactions; this report does not claim an entirely clean application console.

## Implementation and maintenance

- `assets/memory-fail-model.js`: Korean lesson content, conceptual states, phase stops, mitigation behavior and research links.
- `assets/memory-fail-diagrams.js`: circuit geometry and state-driven SVG rendering.
- `assets/memory-fail.js`: selection, playback, waveform rendering, controls, zoom and accessibility.
- `assets/memory-fail.css`: scoped desktop, tablet and mobile layout.
- `tools/test_memory_fail_model.cjs`: causal and recovery invariants, including ECC-to-Scrub handoff.
- `pages/page-5-memory-device/source/sections/01-memory-basics.html`: failure-lab mount and updated summary matrix.
- `source/00-shell-start.html` and `source/99-shell-end.html`: versioned style/script integration.

The basic SRAM/DRAM cell labs and hierarchy material before the replaced failure section were preserved. Existing Chapter 2, Flash/SSD, and MOS work was retained. Reference images are explicitly included by `.gitignore`; no publication, commit, push, or deployment was performed.

The waveform values are intentionally normalized teaching examples. Relevant primary-source links are available inside each lesson's “개념 설명과 참고 자료” disclosure. Pretendard is bundled with its SIL Open Font License, and the interface icons use the existing Tabler/MIT asset set.
