# Dynamic Vancouver scene QA

- Source visual: owner-supplied monochrome instrument dashboard; preserve toolbar, rail, tracking reticle, typography and bottom instruments. The requested geographic subject is now English Bay, Beach Avenue and Stanley Park.
- Desktop viewport: 1266 × 822 CSS pixels; capture 1266 × 822 pixels.
- Mobile viewport: 390 × 844 CSS pixels; shoreline, selected vessel, camera controls, and target inspector remain visible.
- Geographic camera: northwest, 327 degrees at reset. Coastline and footprints are georeferenced, with height limits documented in public/data/vancouver/source-manifest.json.
- The old raster background and its documentation preview were retired from active releases.

## Acceptance

- Real-time scene: Canvas 3D rasterization verified in this browser, where WebGL is disabled. WebGL is selected when supported; its visual path remains unverified on this machine.
- Observed production scene: CPU 3D at 327 degrees, 59 FPS in the captured desktop frame. This is an observation, not a device-independent benchmark.
- Motion: simulation time and rendered frame counter advance. The reticle follows projected vessel positions.
- Camera: dragging changed heading from 327 to 353 degrees and changed the projected geography; reset restored 327 degrees.
- Pause: simulation time remained exactly 108.45 across separate observations; resume restored motion.
- Vessel selection: Harness Learning selection updated the inspector and tracking target.
- Connection layer: checkbox controls scene connections; terrain, track, zoom, and reset use renderer state.
- Production browser JavaScript error logs: none for the verified production origin.
- Source type checking and production build passed. Existing research-workbench acceptance was reused; no unrelated workflow was changed.

## Limits

Vessel motion is simulated. Agent telemetry is disconnected. Terrain/canopy and missing heights are stylized estimates; matched City height attributes describe 2009 conditions. The supplied strait image is a style/composition reference, not the geographic outline of Vancouver.

final result: passed
