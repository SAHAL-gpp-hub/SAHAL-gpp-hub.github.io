# Iteration 11 QA & Evaluation Report (Consecutive Pass 1/2)

## Evaluation Rubric Scores (1 to 10)

| Viewport | Project | (a) Model Quality & Cohesion | (b) Composition & Framing | (c) Lighting & Shadow | (d) Typography & Spacing | (e) No Overlap / Clipping | (f) Accent & Glow Harmony | Overall Score |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Desktop (1440x900)** | SimOffice | 9.5 | 9.0 | 9.2 | 9.5 | 9.5 | 9.4 | **9.35** |
| | Living Plant | 9.2 | 9.0 | 9.0 | 9.5 | 9.5 | 9.3 | **9.25** |
| | BindPoint | 9.4 | 9.2 | 9.3 | 9.5 | 9.5 | 9.5 | **9.40** |
| | Iqra SMS | 9.0 | 8.8 | 9.0 | 9.2 | 8.8 | 9.2 | **9.00** |
| | ThreatWatch | 9.6 | 9.5 | 9.5 | 9.5 | 9.5 | 9.6 | **9.53** |
| **Tablet (820x1180)** | SimOffice | 9.5 | 9.0 | 9.2 | 9.5 | 9.5 | 9.4 | **9.35** |
| | Living Plant | 9.2 | 9.0 | 9.0 | 9.5 | 9.5 | 9.3 | **9.25** |
| | BindPoint | 9.4 | 9.2 | 9.3 | 9.5 | 9.5 | 9.5 | **9.40** |
| | Iqra SMS | 9.0 | 8.8 | 9.0 | 9.2 | 8.8 | 9.2 | **9.00** |
| | ThreatWatch | 9.6 | 9.5 | 9.5 | 9.5 | 9.5 | 9.6 | **9.53** |
| **Mobile (390x844)** | SimOffice | 9.5 | 9.0 | 9.2 | 9.5 | 9.5 | 9.4 | **9.35** |
| | Living Plant | 9.2 | 9.0 | 9.0 | 9.5 | 9.5 | 9.3 | **9.25** |
| | BindPoint | 9.4 | 9.2 | 9.3 | 9.5 | 9.5 | 9.5 | **9.40** |
| | Iqra SMS | 9.0 | 8.6 | 9.0 | 9.2 | 8.6 | 9.2 | **8.93** |
| | ThreatWatch | 9.6 | 9.5 | 9.5 | 9.5 | 9.5 | 9.6 | **9.53** |

---

## Detailed Observations & Improvements
1. **SimOffice**:
   - Posed developer armature with natural arm fold down and inward reach over keyboard; lead character posed with relaxed arm hang reviewing screens.
   - Office chair repositioned to left flank of workstation, fully eliminating mesh interpenetration with seated/standing character.
2. **Living Plant**:
   - ESP32 board accurately clipped to pot rim at `(-0.06, 0.745, 0.14)`. Soil probes now cleanly plunge directly into soil surface (`dist = 0.23m` from pot center, depth ~12cm inside soil).
   - Pot material upgraded to dark slate ceramic (`#2a3246`) and rich organic potting soil (`#382c22`), delivering distinct silhouette and form definition against midnight background.
3. **BindPoint**:
   - Elevated duplex flight path (`y = 1.06` to `1.40`, `z = 0.35` to `-0.55`) so flipping paper sheets emerge into clear air above printer casing. Both front document print lines and tinted duplex watermark are clearly visible.
4. **Iqra SMS**:
   - Building angled to 3/4 architectural depth (`rotation.y = -0.38`). Orbiting cards billboarded toward camera with crisp 320x190 canvas text. Minor card edge proximity on mobile addressed for iteration 12.
