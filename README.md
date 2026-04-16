# Synthetic Webcam Detection Lab

This project is a safe research workbench for studying synthetic-video and
synthetic-image detection. It does **not** create impersonation deepfakes, does
**not** remove labels or watermarks, and does **not** provide evasion guidance
for bypassing detection systems.

The app generates clearly labeled, webcam-like synthetic clips of mundane
activities using browser canvas animation. It can also analyze uploaded local
images and videos so you can prototype detection ideas before connecting real,
consented datasets or approved model providers.

## What It Does

- Generates labeled synthetic webcam-style clips for mundane scenes:
  - watering house plants
  - reading at a desk
  - making coffee
  - folding laundry
- Supports prompt-based scene selection for safe labeled simulations.
- Simulates common webcam properties:
  - low-light sensor noise
  - frame jitter
  - compression-like blocking
  - timestamp overlay
  - synthetic-content watermark
- Records generated clips as WebM in the browser when MediaRecorder is
  available.
- Analyzes uploaded local images and videos without sending files anywhere.
- Runs a baseline detector that scores temporal smoothness, noise consistency,
  edge stability, watermark presence, metadata-like visual overlays, image
  compression signals, and flat-color signals.
- Produces production-style review fields:
  - verdict
  - confidence
  - risk level
  - recommended action
  - detector version
  - plugin-level signal report
- Saves recent analysis history in browser localStorage.
- Exports analysis history as CSV.
- Exports analysis as JSON.
- Adds case review controls, evidence hashing, and forensic HTML export.

## Run

Open `index.html` directly in a modern browser.

## Generate A Synthetic Test Clip

1. Type a prompt, such as `woman watering plants in her house`.
2. Click **Apply Prompt** to map the prompt to a safe labeled scene.
3. Choose duration and webcam artifact strength.
4. Click **Start Preview**.
5. Click **Record Clip** to save a labeled WebM clip.
6. Click **Analyze Current Frames** to score the generated stream.
7. Click **Download Report JSON** to save the detector output.

## Analyze Uploaded Photos Or Videos

1. In **Analyze Uploaded Media**, click **Choose File**.
2. Pick a local image or video file.
3. Click **Analyze Upload**.
4. Read the detector scores in **Detector Baseline**.
5. Click **Download Report JSON** if you want to save the result.

## Production Workbench Features

This version is upgraded from a simple prototype into a local review workbench.
Each completed analysis includes:

- A verdict such as **Likely Synthetic**, **Suspicious**, **Needs Review**, or
  **Low Synthetic Signal**
- A confidence score
- A risk level
- A recommended human-review action
- A detector version string
- Plugin-level scores that explain which signals contributed to the result
- A saved history row for audit and comparison
- Case ID, analyst name, evidence source, and analyst notes
- SHA-256 hashing for uploaded evidence
- Chain-of-custody style metadata
- Review policy thresholds for balanced, strict, or triage-only workflows
- Forensic HTML report export

Use **Export History CSV** to download all recent analysis rows. Use
**Clear History** to reset local saved runs.

## Investigation Workflow

1. Enter a **Case ID** and **Analyst**.
2. Choose a **Review policy**:
   - Balanced review: default thresholds
   - Strict investigation: lower threshold for suspicious findings
   - Triage only: higher threshold to reduce low-priority flags
3. Enter the **Evidence source**.
4. Add analyst notes.
5. Upload a photo or video, or generate a labeled synthetic test clip.
6. Run analysis.
7. Review the verdict, confidence, risk level, plugin signals, and evidence
   hash.
8. Export:
   - JSON report for machine-readable records
   - Forensic HTML report for human review
   - CSV history for batch tracking

Uploaded files are hashed locally with SHA-256 in the browser. The hash is
stored in the JSON and forensic HTML reports.

The browser usually supports:

- Images: PNG, JPEG, WebP, and browser-supported still formats
- Videos: MP4 and WebM are the safest choices

Uploaded media stays local to your browser. The app samples pixels and frames
using browser APIs.

If your browser blocks local recording APIs, run a local static server:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Safe Research Path

Use this project to build detection algorithms against:

- generated clips that are visibly and persistently labeled synthetic
- images or videos of consenting participants
- licensed datasets that explicitly allow synthetic-media research
- public model outputs that are retained and disclosed according to the
  provider's terms

Do not use this project to impersonate real people, misrepresent live webcam
feeds, remove provenance indicators, or bypass detection systems.

## What Is Intentionally Not Included

This project does not include:

- Photorealistic real-person deepfake generation
- Real-time impersonation through video chat
- Instructions or tooling to bypass detection software
- Watermark removal or provenance removal

Those capabilities can enable impersonation or evasion. The safe replacement is
prompt-based generation of visibly labeled synthetic webcam simulations for
detection research.

## Project Layout

```text
.
├── index.html
├── src
│   ├── app.js
│   ├── detector.js
│   ├── generator.js
│   └── recorder.js
└── styles
    └── main.css
```

## Next Extensions

- Add a consented-video ingestion pipeline.
- Add model-provider adapters that preserve provenance and labels.
- Add detector plugins for face/pose consistency, lighting consistency, and
  audio/video sync.
- Save experiment runs to a local database.

## Enterprise Addendum

This local build now includes enterprise-style case review controls:

- Case ID, analyst name, evidence source, and analyst notes
- Balanced, strict, and triage-only review policies
- SHA-256 evidence hashing for uploaded files when browser Web Crypto is
  available
- Evidence integrity display in the report panel
- Chain-of-custody style metadata inside exported JSON
- Forensic HTML report export for human review
- CSV history export for audit tracking

For a real investigations deployment, connect this app to:

- a validated trained detector model
- authenticated user accounts
- encrypted backend evidence storage
- immutable audit logs
- documented validation metrics such as precision, recall, and false-positive
  rate
