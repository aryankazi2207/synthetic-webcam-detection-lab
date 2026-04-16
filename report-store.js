const REPORT_STORE_KEY = "syntheticDetectionLab.history.v1";

class ReportStore {
  constructor(limit = 50) {
    this.limit = limit;
  }

  all() {
    try {
      const parsed = JSON.parse(localStorage.getItem(REPORT_STORE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  add(report) {
    if (!report || report.status !== "complete") return this.all();
    const history = this.all();
    const record = {
      id: `run-${Date.now()}`,
      savedAt: new Date().toISOString(),
      mediaType: report.mediaType || "unknown",
      source: report.metadata?.source || "Generated preview",
      verdict: report.verdict || "Unknown",
      riskLevel: report.riskLevel || "unknown",
      confidence: report.confidence || 0,
      syntheticLikelihood: report.scores?.syntheticLikelihood || 0,
      detectorVersion: report.detectorVersion || "unknown",
      report
    };
    history.unshift(record);
    const trimmed = history.slice(0, this.limit);
    localStorage.setItem(REPORT_STORE_KEY, JSON.stringify(trimmed));
    return trimmed;
  }

  clear() {
    localStorage.removeItem(REPORT_STORE_KEY);
    return [];
  }

  toCsv() {
    const rows = this.all();
    const header = [
      "savedAt",
      "mediaType",
      "source",
      "verdict",
      "riskLevel",
      "confidence",
      "syntheticLikelihood",
      "detectorVersion"
    ];
    const lines = [header.join(",")];
    for (const row of rows) {
      lines.push(
        header
          .map((field) => csvCell(row[field]))
          .join(",")
      );
    }
    return lines.join("\n");
  }
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

window.ReportStore = ReportStore;
