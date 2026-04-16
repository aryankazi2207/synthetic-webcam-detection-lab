# Synthetic Webcam Detection Lab

Synthetic Webcam Detection Lab is a browser-based synthetic media detection and case review workbench. It can generate labeled synthetic webcam-style clips from safe prompts, analyze uploaded photos and videos, produce detector scores, and export forensic-style reports with case metadata and evidence integrity information.

## Project Overview

This project explores synthetic media and deepfake-style detection in a safe and responsible way.

The original idea was to study AI-generated webcam-like videos of people doing mundane activities and build detection algorithms to identify whether media is real or synthetic. For ethical reasons, this project does not create deceptive real-person deepfakes and does not attempt to bypass detection software.

Instead, the project focuses on:

- Safe prompt-based synthetic webcam simulation
- Photo and video upload analysis
- Detection scoring
- Case review workflow
- Evidence metadata
- Report generation
- Responsible synthetic media research

The app runs locally in the browser. Uploaded files stay on the user’s device and are analyzed using browser APIs.

## Features

- Prompt-based synthetic webcam-style video generation
- Safe labeled synthetic scenes
- Mundane task simulations such as:
  - watering plants
  - reading at a desk
  - making coffee
  - folding laundry
- Webcam-style effects:
  - motion jitter
  - sensor noise
  - compression-like artifacts
  - timestamp overlay
  - webcam-style framing
- Photo upload analysis
- Video upload analysis
- Local browser-based detection
- Synthetic likelihood scoring
- Verdict generation
- Confidence scoring
- Risk level classification
- Plugin-style signal breakdown
- Case ID and analyst metadata
- Evidence source and analyst notes
- SHA-256 evidence hashing when browser support is available
- Chain-of-custody style metadata
- JSON report export
- CSV history export
- Forensic HTML report export
- Local analysis history using browser storage

## Detection Signals

The baseline detector analyzes different signals depending on the media type.

For videos, it checks:

- Temporal smoothness
- Noise consistency
- Edge stability
- Watermark or overlay presence
- Overlay consistency

For images, it checks:

- Local noise patterns
- Edge signals
- Compression-like block patterns
- Flat-color distribution
- Watermark or overlay presence

The detector produces:

- Synthetic likelihood score
- Verdict
- Confidence score
- Risk level
- Recommended action
- Plugin-level signal explanations

## How To Use

1. Open `index.html` in a modern browser.
2. Enter case information:
   - Case ID
   - Analyst name
   - Evidence source
   - Analyst notes
3. Choose a review policy:
   - Balanced review
   - Strict investigation
   - Triage only

## Generate A Synthetic Test Clip

1. Type a prompt, for example:

   ```text
   woman watering plants in her house

