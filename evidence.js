class EvidenceManager {
  constructor(fields) {
    this.fields = fields;
    this.latestEvidence = null;
  }

  async buildForUpload(file) {
    if (!file) return this.buildForGenerated();
    const hash = await this.sha256(file);
    this.latestEvidence = {
      evidenceId: `evidence-${Date.now()}`,
      fileName: file.name,
      mimeType: file.type || "unknown",
      sizeBytes: file.size,
      sha256: hash,
      acquiredAt: new Date().toISOString(),
      source: this.fields.source.value || "Local upload",
      acquisitionMethod: "Browser local file selection",
      custody: this.caseMetadata()
    };
    return this.latestEvidence;
  }

  buildForGenerated() {
    this.latestEvidence = {
      evidenceId: `generated-${Date.now()}`,
      fileName: "Generated preview frames",
      mimeType: "browser/canvas",
      sizeBytes: 0,
      sha256: "not-applicable-generated-preview",
      acquiredAt: new Date().toISOString(),
      source: this.fields.source.value || "Synthetic preview generator",
      acquisitionMethod: "Browser canvas generator",
      custody: this.caseMetadata()
    };
    return this.latestEvidence;
  }

  caseMetadata() {
    return {
      caseId: this.fields.caseId.value || `CASE-${new Date().toISOString().slice(0, 10)}`,
      analyst: this.fields.analyst.value || "Unassigned analyst",
      notes: this.fields.notes.value || "",
      policy: this.fields.policy.value || "balanced",
      recordedAt: new Date().toISOString()
    };
  }

  policyThresholds() {
    const policy = this.fields.policy.value || "balanced";
    if (policy === "strict") {
      return {
        suspicious: 0.5,
        likelySynthetic: 0.72,
        reviewLabel: "Strict investigation"
      };
    }
    if (policy === "lenient") {
      return {
        suspicious: 0.7,
        likelySynthetic: 0.9,
        reviewLabel: "Triage only"
      };
    }
    return {
      suspicious: 0.62,
      likelySynthetic: 0.82,
      reviewLabel: "Balanced review"
    };
  }

  applyPolicy(report) {
    if (!report || report.status !== "complete") return report;
    const thresholds = this.policyThresholds();
    const score = report.scores?.syntheticLikelihood || 0;
    let verdict = "Needs Review";
    let riskLevel = "medium";
    let recommendedAction = "Send to human review and compare against trusted source material.";

    if (score >= thresholds.likelySynthetic) {
      verdict = "Likely Synthetic";
      riskLevel = "high";
      recommendedAction = "Treat as synthetic until verified by provenance, source records, or manual review.";
    } else if (score >= thresholds.suspicious) {
      verdict = "Suspicious";
      riskLevel = "elevated";
      recommendedAction = "Do not rely on this media alone; request provenance or a second detector pass.";
    } else if (score <= 0.28) {
      verdict = "Low Synthetic Signal";
      riskLevel = "low";
      recommendedAction = "No strong synthetic signal found by this baseline; keep normal verification steps.";
    }

    return {
      ...report,
      verdict,
      riskLevel,
      recommendedAction,
      caseReview: {
        ...this.caseMetadata(),
        thresholds
      },
      evidence: this.latestEvidence || this.buildForGenerated()
    };
  }

  async sha256(file) {
    if (!crypto.subtle) {
      return "sha256-unavailable-browser-context";
    }
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
}

function buildForensicHtml(report) {
  const scores = report.scores || {};
  const plugins = report.plugins || [];
  const evidence = report.evidence || {};
  const review = report.caseReview || {};
  const rows = Object.entries(scores)
    .map(([key, value]) => `<tr><td>${escapeReportHtml(key)}</td><td>${Math.round(value * 100)}%</td></tr>`)
    .join("");
  const pluginRows = plugins
    .map(
      (plugin) =>
        `<tr><td>${escapeReportHtml(plugin.name)}</td><td>${Math.round(plugin.score * 100)}%</td><td>${escapeReportHtml(plugin.status)}</td><td>${escapeReportHtml(plugin.summary)}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Forensic Media Review Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #17201e; }
    h1, h2 { margin-bottom: 8px; }
    .banner { border: 2px solid #2d7f6f; padding: 16px; margin-bottom: 18px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; }
    th, td { border: 1px solid #cbd5cf; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f6f7f4; }
    .warning { border-left: 4px solid #d2453d; padding: 10px; background: #fff3f2; }
  </style>
</head>
<body>
  <h1>Forensic Media Review Report</h1>
  <div class="banner">
    <strong>Verdict:</strong> ${escapeReportHtml(report.verdict || "Unknown")}<br>
    <strong>Confidence:</strong> ${Math.round((report.confidence || 0) * 100)}%<br>
    <strong>Risk:</strong> ${escapeReportHtml(report.riskLevel || "unknown")}<br>
    <strong>Recommended action:</strong> ${escapeReportHtml(report.recommendedAction || "")}
  </div>
  <h2>Case</h2>
  <table>
    <tr><th>Case ID</th><td>${escapeReportHtml(review.caseId || "")}</td></tr>
    <tr><th>Analyst</th><td>${escapeReportHtml(review.analyst || "")}</td></tr>
    <tr><th>Policy</th><td>${escapeReportHtml(review.thresholds?.reviewLabel || review.policy || "")}</td></tr>
    <tr><th>Notes</th><td>${escapeReportHtml(review.notes || "")}</td></tr>
  </table>
  <h2>Evidence Integrity</h2>
  <table>
    <tr><th>Evidence ID</th><td>${escapeReportHtml(evidence.evidenceId || "")}</td></tr>
    <tr><th>File</th><td>${escapeReportHtml(evidence.fileName || "")}</td></tr>
    <tr><th>MIME type</th><td>${escapeReportHtml(evidence.mimeType || "")}</td></tr>
    <tr><th>Size bytes</th><td>${escapeReportHtml(evidence.sizeBytes ?? "")}</td></tr>
    <tr><th>SHA-256</th><td>${escapeReportHtml(evidence.sha256 || "")}</td></tr>
    <tr><th>Source</th><td>${escapeReportHtml(evidence.source || "")}</td></tr>
    <tr><th>Acquired at</th><td>${escapeReportHtml(evidence.acquiredAt || "")}</td></tr>
  </table>
  <h2>Detector Scores</h2>
  <table><tr><th>Signal</th><th>Score</th></tr>${rows}</table>
  <h2>Plugin Signals</h2>
  <table><tr><th>Plugin</th><th>Score</th><th>Status</th><th>Summary</th></tr>${pluginRows}</table>
  <p class="warning">This local baseline is a review aid. Final investigative claims require validated models, provenance records, and human review.</p>
</body>
</html>`;
}

function escapeReportHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.EvidenceManager = EvidenceManager;
window.buildForensicHtml = buildForensicHtml;
