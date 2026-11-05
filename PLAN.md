# Portfolio Implementation Plan: Sahal Mansiya (SAHAL-gpp-hub)

## Overview
A production-grade, highly cohesive 3D portfolio static site built with Vite, TypeScript, and Three.js, deployed to GitHub Pages at `https://SAHAL-gpp-hub.github.io`, paired with a matching GitHub profile README repository (`SAHAL-gpp-hub`) featuring automated preview recordings and custom typography.

## Architecture & Requirements
- **Theme & Design**: Midnight dark base `#0d1020`, text `#eceef7`, muted `#8b90ab`. Dynamic accent colour per project animated via CSS `@property --accent-color`. Fonts: `Bricolage Grotesque` (display) and `Instrument Sans` (body).
- **Layout**: Desktop split 2-column layout (content left, full-height 3D stage right). Mobile (<860px) responsive layout with 56svh 3D stage on top, scrollable content below.
- **3D Engine**: Three.js with ACESFilmicToneMapping, sRGB output encoding, unified lighting (HemisphereLight + key + rim + low intensity HDRI env map), soft contact shadows (blob shadow plane under each model).
- **Interactive Motion**: Intro dolly-in camera animation, inertia-based orbit/drag controls on stage, model cross-fade on project switch, subtle per-model idle animations, full `prefers-reduced-motion` support.
- **Performance Budget**: Initial bundle < 3 MB, each GLB under 1.5 MB, lazy loading for subsequent models, steady 60fps (p95 frame time < 20ms), LCP < 2.5s, Lighthouse Perf >= 90, A11y >= 95.

---

## Phases

### Phase 0: Scaffold
- Initialize Vite + TypeScript project.
- Configure dependencies: `three`, `@types/three`.
- Setup build tooling, TypeScript config, linting/formatting, and standard folder structure:
  - `src/` (main entry, styles, 3D scene rig, project models, state manager, keyboard navigation).
  - `public/models/` (local CC0/CC-BY GLB models and textures).
  - `qa/` (Playwright automated test suites, screenshots, verification reports).
- Initialize git repository and commit.

### Phase 1: Asset Sourcing and CREDITS
- Source high-quality CC0 / CC-BY 3D assets:
  1. **SimOffice**: Office desk, computer monitors, low-poly animated/rigged characters or office equipment on floor slab (Kenney/Quaternius CC0).
  2. **Living Plant**: Detailed potted plant model (Poly Pizza CC0/CC-BY), procedural ESP32 PCB with blinking status LED, soil moisture probes, animated pulsing droplet.
  3. **BindPoint**: Production laser/commercial printer (CC0/CC-BY), procedural animated duplex paper sheets emerging from tray and flipping.
  4. **Iqra SMS**: Modern architectural school/campus building model with orbiting holographic report-card glyph planes.
  5. **ThreatWatch**: Procedural GPU particle system (normal activity cluster + 3 pulsating outlier anomaly nodes with custom GLSL shader).
- Poly Haven CC0 clean studio HDRI or pre-filtered environment map.
- Generate and verify `CREDITS.md` with exact asset titles, authors, licenses, and source URLs. Add in-app accessible Credits modal/link.

### Phase 2: Asset Optimisation
- Run geometry / texture inspection and optimisation using `gltf-transform` (meshopt/Draco compression, texture downsizing to max 1024 WebP/PNG).
- Ensure all GLB models are under 1.5 MB.
- Normalise model scales and pivots so each model fits neatly into a standardized bounding volume centered at `(0, 0, 0)` sitting on floor plane `y=0`.

### Phase 3: Scene and Cohesion Rig
- Core Three.js render loop with fixed tick / requestAnimationFrame.
- Lighting: Warm/cool HemisphereLight, directional Key light, subtle Rim light, and subtle HDRI ambient.
- Tonemapping: ACESFilmicToneMapping, outputColorSpace = SRGBColorSpace.
- Contact Shadow: Soft circular feathered contact shadow plane under the models to eliminate floating.
- Material treatment cohesion pass: Standardize PBR roughness, metalness, and tone across imported models.
- Camera and Controls: Smooth inertia drag rotation, damping, clamped vertical angle, responsive FOV / camera distance adapting to aspect ratio and mobile viewports.
- Model transition manager: cross-fade opacity and scale transitions between active project models.

### Phase 4: Per-Project Objects and Animations
- Project 1 (SimOffice): Desk + monitors + 2 low-poly bobbing characters on a platform slab with idle typing/bobbing motion.
- Project 2 (Living Plant): Plant with swaying leaves (vertex shader or subtle bone sway), procedural ESP32 board with blinking green/accent LED, soil probes, pulsing water droplet.
- Project 3 (BindPoint): 3D Printer with procedural paper path animation: sheets eject, flip over to show dual-sided front/back tint.
- Project 4 (Iqra SMS): School building with 3 orbiting report-card planes.
- Project 5 (ThreatWatch): Custom Three.js BufferGeometry GPU point cloud with custom ShaderMaterial (inner stable cluster + 3 pulsing outlier nodes in `#ff6b81`).

### Phase 5: UI and Copy
- Implement exact copy without deviation:
  - Headline: "Real data, real hardware, real-time 3D."
  - Lead: "I build interactive 3D in the browser, IoT digital twins and the production backends behind them."
  - 5 project cards/items with exact titles, descriptions, accents, tags, and repo links.
  - Footer with GitHub, LinkedIn, Email, "Gujarat, India", and "Credits" trigger.
- Implement typography with Google Fonts `Bricolage Grotesque` and `Instrument Sans`.
- Desktop split layout vs mobile top-stage layout (<860px).
- Dynamic accent transition using CSS `@property --accent-color`.
- Active project 3px accent bar with smooth progress fill during model loading.
- Keyboard navigation (ArrowLeft, ArrowRight) and full accessibility tree (`aria-current`, visible focus rings, real `<button>` elements).

### Phase 6: Accessibility and Performance
- Implement `prefers-reduced-motion` detection: immediately stops idle wobbles, smooths camera instantly.
- Test Playwright interactions: keyboard arrows, click selection, drag orbit, modal opening/closing.
- Measure frame times (assert p95 < 20ms over 10s).
- Verify bundle size < 3 MB initial load.
- Run Lighthouse audits (Desktop Perf >= 90, A11y >= 95).

### Phase 7: Deploy
- Setup GitHub Actions deployment workflow (`.github/workflows/deploy.yml`) to deploy to GitHub Pages (`gh-pages` / Pages artifact).
- Create repository `SAHAL-gpp-hub/SAHAL-gpp-hub.github.io` via GitHub API with our authenticated token.
- Push repository and trigger GitHub Actions build.
- Verify live site returns HTTP 200 at `https://SAHAL-gpp-hub.github.io`.

### Phase 8: README Repo with Auto-Recorded Preview
- Clone or initialize `SAHAL-gpp-hub` profile repository.
- Auto-record site video / screenshot sequence and generate `assets/preview.mp4` and `assets/preview.gif`.
- Generate crisp custom `assets/banner.svg` with Bricolage Grotesque / Instrument Sans styling and midnight dark palette.
- Write `README.md` strictly following constraints (no emoji walls, no badge spam, centered banner, one-line links, 2 short paragraphs, preview GIF linked to live site, project table, stack table, one-line footer).
- Commit and push to `SAHAL-gpp-hub/SAHAL-gpp-hub`.

### Phase 9: Verification Loop & Acceptance Gates
- Multi-viewport QA screenshots (1440x900, 820x1180, 390x844) across all 5 projects.
- Self-evaluation scoring rubric in `/qa/iter-N/REPORT.md`.
- Iterate until all criteria pass >= 8 in two consecutive iterations.
- Final completion summary.
