# BogieVision Inspection Console

A self-contained, browser-based demonstration interface for railway bogie / undercarriage foreign-object inspection. It was designed from the provided visual theme and does not need Node.js packages or global installations.

## Run it

The quickest route is to open `index.html` in a browser. For live camera access, serve the folder on localhost:

```bash
cd "/Users/priyansh/Desktop/BogieVision-Inspection-Console"
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Included functions

- Image upload (JPG, PNG, WebP), a live camera flow, and a built-in demo frame
- Safety checklist and high-accuracy mode
- Animated scan progress, annotated anomaly candidates, and confidence scores
- Evidence review, release / maintenance decision capture, session log, and JSON report export
- Responsive layout and light/dark appearance switch

## Important safety note

This is a front-end prototype: the detection sequence is simulated and is not a certified computer-vision system. Connect a validated vision model and follow your railway operator's safety and sign-off processes before using it for live operational decisions.
