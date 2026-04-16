const canvas = document.querySelector("#webcamCanvas");
const sceneSelect = document.querySelector("#sceneSelect");
const durationSelect = document.querySelector("#durationSelect");
const artifactSelect = document.querySelector("#artifactSelect");
const promptInput = document.querySelector("#promptInput");
const applyPromptButton = document.querySelector("#applyPromptButton");
const startButton = document.querySelector("#startButton");
const recordButton = document.querySelector("#recordButton");
const stopButton = document.querySelector("#stopButton");
const analyzeButton = document.querySelector("#analyzeButton");
const analyzeUploadButton = document.querySelector("#analyzeUploadButton");
const downloadReportButton = document.querySelector("#downloadReportButton");
const downloadForensicButton = document.querySelector("#downloadForensicButton");
const downloadCsvButton = document.querySelector("#downloadCsvButton");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
const caseIdInput = document.querySelector("#caseIdInput");
const analystInput = document.querySelector("#analystInput");
const policySelect = document.querySelector("#policySelect");
const sourceInput = document.querySelector("#sourceInput");
const notesInput = document.querySelector("#notesInput");
const mediaUpload = document.querySelector("#mediaUpload");
const mediaPreview = document.querySelector("#mediaPreview");
const statusText = document.querySelector("#statusText");
const reportOutput = document.querySelector("#reportOutput");
const scoreGrid = document.querySelector("#scoreGrid");
const verdictPanel = document.querySelector("#verdictPanel");
const evidencePanel = document.querySelector("#evidencePanel");
const pluginGrid = document.querySelector("#pluginGrid");
const downloadArea = document.querySelector("#downloadArea");
const historyBody = document.querySelector("#historyBody");

const generator = new window.SyntheticWebcamGenerator(canvas);
const recorder = new window.CanvasRecorder(canvas, addClipDownload);
const uploadAnalyzer = new window.LocalMediaAnalyzer(mediaUpload, mediaPreview);
const reportStore = new window.ReportStore();
const evidenceManager = new window.EvidenceManager({
  caseId: caseIdInput,
  analyst: analystInput,
  policy: policySelect,
  source: sourceInput,
  notes: notesInput
});
let latestReport = null;

drawInitialState();
renderHistory(reportStore.all());

applyPromptButton.addEventListener("click", () => {
  const scene = window.matchPromptToScene(promptInput.value);
  sceneSelect.value = scene;
  setStatus("Prompt applied");
});

startButton.addEventListener("click", () => {
  generator.start(readSettings());
  setStatus("Previewing");
});

recordButton.addEventListener("click", () => {
  if (!generator.running) {
    generator.start(readSettings());
  }
  try {
    recorder.start(Number(durationSelect.value));
    setStatus("Recording");
  } catch (error) {
    setStatus("No recorder");
    addMessage(error.message);
  }
});

stopButton.addEventListener("click", () => {
  recorder.stop();
  generator.stop();
  setStatus("Stopped");
});

analyzeButton.addEventListener("click", async () => {
  evidenceManager.buildForGenerated();
  latestReport = window.analyzeFrames(generator.getFrames(), {
    source: "Generated preview",
    scene: sceneSelect.value,
    prompt: promptInput.value || "woman watering plants in her house",
    artifactLevel: artifactSelect.value
  });
  latestReport = evidenceManager.applyPolicy(latestReport);
  finishAnalysis(latestReport);
});

analyzeUploadButton.addEventListener("click", async () => {
  setStatus("Analyzing upload");
  analyzeUploadButton.disabled = true;
  try {
    await evidenceManager.buildForUpload(uploadAnalyzer.currentFile());
    latestReport = await uploadAnalyzer.analyze();
    latestReport = evidenceManager.applyPolicy(latestReport);
    finishAnalysis(latestReport);
    setStatus("Upload analyzed");
  } catch (error) {
    latestReport = {
      status: "upload_error",
      message: error.message,
      scores: {}
    };
    renderReport(latestReport);
    setStatus("Upload error");
  } finally {
    analyzeUploadButton.disabled = false;
  }
});

downloadReportButton.addEventListener("click", () => {
  if (!latestReport) {
    latestReport = window.analyzeFrames(generator.getFrames());
    latestReport = evidenceManager.applyPolicy(latestReport);
    finishAnalysis(latestReport);
  }
  const blob = new Blob([JSON.stringify(latestReport, null, 2)], {
    type: "application/json"
  });
  addDownload(blob, `synthetic-detection-report-${Date.now()}.json`, "Download JSON report");
});

downloadForensicButton.addEventListener("click", () => {
  if (!latestReport || latestReport.status !== "complete") {
    addMessage("Run a complete analysis before exporting a forensic report.");
    return;
  }
  const html = window.buildForensicHtml(latestReport);
  const blob = new Blob([html], {
    type: "text/html"
  });
  addDownload(blob, `forensic-media-report-${Date.now()}.html`, "Download forensic HTML report");
});

downloadCsvButton.addEventListener("click", () => {
  const blob = new Blob([reportStore.toCsv()], {
    type: "text/csv"
  });
  addDownload(blob, `synthetic-detection-history-${Date.now()}.csv`, "Download history CSV");
});

clearHistoryButton.addEventListener("click", () => {
  renderHistory(reportStore.clear());
  setStatus("History cleared");
});

function readSettings() {
  return {
    scene: sceneSelect.value,
    artifacts: artifactSelect.value,
    prompt: promptInput.value || "woman watering plants in her house"
  };
}

function drawInitialState() {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#17201e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e5f4ee";
  ctx.font = "800 42px ui-sans-serif, system-ui";
  ctx.fillText("Synthetic Webcam Detection Lab", 56, 110);
  ctx.font = "600 24px ui-sans-serif, system-ui";
  ctx.fillText("Choose a scene, start preview, then analyze the generated frames.", 56, 154);
  ctx.fillStyle = "#d2453d";
  ctx.fillRect(56, canvas.height - 96, 420, 42);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 20px ui-sans-serif, system-ui";
  ctx.fillText("SYNTHETIC CONTENT ONLY", 76, canvas.height - 68);
  renderReport({
    status: "ready",
    scores: {}
  });
}

function renderReport(report) {
  reportOutput.textContent = JSON.stringify(report, null, 2);
  renderVerdict(report);
  renderEvidence(report.evidence);
  renderPlugins(report.plugins || []);
  scoreGrid.innerHTML = "";
  const scores = report.scores || {};
  const entries = Object.entries(scores);
  if (entries.length === 0) {
    scoreGrid.innerHTML = '<div class="score"><b>Status</b><span>Ready</span></div>';
    return;
  }

  for (const [key, value] of entries) {
    const node = document.createElement("div");
    node.className = "score";
    node.innerHTML = `<b>${labelize(key)}</b><span>${Math.round(value * 100)}%</span>`;
    scoreGrid.append(node);
  }
}

function renderEvidence(evidence) {
  if (!evidence) {
    evidencePanel.innerHTML = "<b>Evidence Integrity</b><span>No evidence hash recorded yet.</span>";
    return;
  }
  evidencePanel.innerHTML = `
    <b>Evidence Integrity</b>
    <span>File: ${escapeHtml(evidence.fileName)} | SHA-256: ${escapeHtml(evidence.sha256)} | Source: ${escapeHtml(evidence.source)}</span>
  `;
}

function finishAnalysis(report) {
  renderReport(report);
  renderHistory(reportStore.add(report));
}

function renderVerdict(report) {
  const verdict = report.verdict || "Ready";
  const confidence = report.confidence ? `${Math.round(report.confidence * 100)}%` : "0%";
  const action = report.recommendedAction || "Run an analysis to generate a review recommendation.";
  verdictPanel.innerHTML = `
    <div>
      <b>Verdict</b>
      <span>${escapeHtml(verdict)}</span>
    </div>
    <div>
      <b>Confidence</b>
      <span>${escapeHtml(confidence)}</span>
    </div>
    <div>
      <b>Recommended Action</b>
      <span>${escapeHtml(action)}</span>
    </div>
  `;
}

function renderPlugins(plugins) {
  pluginGrid.innerHTML = "";
  if (plugins.length === 0) return;

  for (const plugin of plugins) {
    const node = document.createElement("div");
    node.className = "plugin-card";
    node.innerHTML = `
      <b>${escapeHtml(plugin.name)}</b>
      <span>${Math.round(plugin.score * 100)}% ${escapeHtml(plugin.status)}</span>
      <p>${escapeHtml(plugin.summary)}</p>
    `;
    pluginGrid.append(node);
  }
}

function renderHistory(history) {
  historyBody.innerHTML = "";
  if (history.length === 0) {
    historyBody.innerHTML = '<tr><td colspan="6">No saved analyses yet.</td></tr>';
    return;
  }

  for (const row of history) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(new Date(row.savedAt).toLocaleString())}</td>
      <td>${escapeHtml(row.mediaType)}</td>
      <td>${escapeHtml(row.source)}</td>
      <td>${escapeHtml(row.verdict)}</td>
      <td>${escapeHtml(row.riskLevel)}</td>
      <td>${Math.round(row.confidence * 100)}%</td>
    `;
    historyBody.append(tr);
  }
}

function addClipDownload(blob) {
  addDownload(blob, `synthetic-webcam-clip-${Date.now()}.webm`, "Download labeled WebM clip");
  setStatus("Clip ready");
}

function addDownload(blob, filename, label) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.textContent = label;
  downloadArea.prepend(link);
}

function addMessage(message) {
  const text = document.createElement("p");
  text.textContent = message;
  downloadArea.prepend(text);
}

function setStatus(text) {
  statusText.textContent = text;
}

function labelize(value) {
  return value.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
