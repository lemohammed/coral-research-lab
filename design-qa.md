# Design QA

- Source visual truth: owner-supplied 1266 × 822 dashboard screenshot.
- Implementation: production build, console home with CORAL selected, default layers, no dialog.
- Desktop viewport: 1266 × 822 CSS pixels; captures normalized to 1266 × 822 pixels, density 1.
- Mobile viewport: 390 × 844 CSS pixels.
- Full comparison: the supplied and implementation captures were combined side by side and visually inspected. Toolbar, rail width, map reticle, panel boundaries, monochrome landscape, orange accents, and interface density match the intended visual structure.
- Focused comparison: rail controls, target inspector, queue metrics, and review feed were inspected. Domain labels and research contracts intentionally replace maritime data. The terrain is newly generated artwork, not a pixel-identical copy of the reference.

## Findings

No remaining actionable P0/P1/P2 findings.

## Comparison history

1. P2: focus caused the hidden-overflow root to scroll internally by 13–15 pixels, clipping the toolbar. Fixed with overflow: clip; production DOM reports scrollTop 0 and toolbar top 11px.
2. P2: the mobile inspector could exceed its panel. Reduced diagram height and row gaps. Production DOM reports the final field ending at y822 within the 844px viewport.
3. P2: the local workbench initially required a hosted identity for storage. Added schema-validated browser persistence when authenticated storage is unavailable and made the storage mode visible. Composition and reopening the architecture confirmed persistence.

## Interaction acceptance

- Map method selection updates the inspector.
- Layer checkboxes and reset controls respond.
- New Harness Learning finding expands with distinct mechanism/local-benefit confidence and a primary source link.
- Crossref search returned 12 live results.
- A CORAL/Dream-RSI composition was generated, saved, and opened in the architecture editor.
- A named architecture export was downloaded and its JSON inspected; it remains design_only and spending disabled.
- Research replay advanced through the 25 retained events and paused.
- Browser error logs checked: no JavaScript errors in the verified flow.
- Type checking, focused domain checks, production build, and fresh local database initialization passed.

## Follow-up polish

Generated terrain contours and vessel detail differ from the source pixels. Hidden responsive charts can emit non-fatal Recharts dimension warnings while transitioning viewports. The app labels waveforms as illustrative and live agents as disconnected.

final result: passed
