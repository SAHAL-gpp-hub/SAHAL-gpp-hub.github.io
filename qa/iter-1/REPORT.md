# Iteration 1 QA & Evaluation Report

## Evaluation Rubric Scores (1 to 10)

| Viewport | Project | (a) Model Quality & Cohesion | (b) Composition & Framing | (c) Lighting & Shadow | (d) Typography & Spacing | (e) No Overlap / Clipping | (f) Accent & Glow Harmony | Overall Score |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Desktop (1440x900)** | SimOffice | 5 | 6 | 6 | 9 | 6 | 8 | **6.67** |
| | Living Plant | 7 | 6 | 7 | 9 | 8 | 8 | **7.50** |
| | BindPoint | 6 | 6 | 5 | 9 | 7 | 8 | **6.83** |
| | Iqra SMS | 8 | 7 | 8 | 9 | 7 | 9 | **8.00** |
| | ThreatWatch | 9 | 9 | 9 | 9 | 9 | 9 | **9.00** |
| **Tablet (820x1180)** | SimOffice | 5 | 6 | 6 | 9 | 6 | 8 | **6.67** |
| | Living Plant | 7 | 6 | 7 | 9 | 8 | 8 | **7.50** |
| | BindPoint | 6 | 6 | 5 | 9 | 7 | 8 | **6.83** |
| | Iqra SMS | 8 | 7 | 8 | 9 | 7 | 9 | **8.00** |
| | ThreatWatch | 9 | 9 | 9 | 9 | 9 | 9 | **9.00** |
| **Mobile (390x844)** | SimOffice | 5 | 6 | 6 | 9 | 7 | 8 | **6.83** |
| | Living Plant | 7 | 6 | 7 | 9 | 8 | 8 | **7.50** |
| | BindPoint | 6 | 6 | 5 | 9 | 7 | 8 | **6.83** |
| | Iqra SMS | 8 | 7 | 8 | 9 | 7 | 9 | **8.00** |
| | ThreatWatch | 9 | 9 | 9 | 9 | 9 | 9 | **9.00** |

---

## Specific Defects Identified (Scores < 8)

1. **SimOffice**:
   - Defect 1: Characters default to T-pose with arms sticking straight out sideways. Need natural resting arm angles or typing pose.
   - Defect 2: Desk model was using an upright communications relay tower rather than an office desk with workstation monitors.
   - Defect 3: Chair scale was disproportionately large relative to the desk and characters.
   - Defect 4: Floor slab was scaled too small (`0.015`), leaving characters almost standing on void. Needs a clean, substantial, grounded platform slab.

2. **Living Plant**:
   - Defect 1: Water droplet was floating unnaturally high above the plant and was disproportionately large (looked like a floating pill). Needs to hover gracefully just above the leaf canopy with delicate scale and glass-like refraction.
   - Defect 2: ESP32 board had overly long probe legs making it look like a stilt table next to the pot rather than an IoT sensor attached to the plant pot rim.

3. **BindPoint**:
   - Defect 1: Printer model materials were overly dark (diffuse black), losing details in the midnight background.
   - Defect 2: Duplex paper sheets were oversized and flying far outside the printer viewport rather than smoothly exiting the tray.

4. **Iqra SMS**:
   - Orbit radius of report-card planes was slightly tight, causing 2 of the 3 cards to pass behind the large building body. Needs a wider orbit radius (~2.4) and subtle tilt so all 3 cards stay visible in orbit.

## Next Actions for Iteration 2
- Address all defects listed above to lift every project to >= 8.0 across all viewports.
