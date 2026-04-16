function analyzeFrames(frames, metadata = {}) {
  if (frames.length < 2) {
    return {
      status: "not_enough_frames",
      message: "Start the preview and collect frames before analyzing.",
      metadata,
      scores: {}
    };
  }

  const sampled = frames.slice(-60);
  const temporal = temporalSmoothness(sampled);
  const noise = noiseConsistency(sampled);
  const edges = edgeStability(sampled);
  const watermark = watermarkPresence(sampled.at(-1));
  const overlay = overlayConsistency(sampled);
  const syntheticScore = clamp(
    temporal * 0.22 +
      noise * 0.18 +
      edges * 0.2 +
      watermark * 0.25 +
      overlay * 0.15,
    0,
    1
  );
  const signals = {
    temporalSmoothness: round(temporal),
    noiseConsistency: round(noise),
    edgeStability: round(edges),
    watermarkPresence: round(watermark),
    overlayConsistency: round(overlay)
  };
  const risk = buildRiskModel(syntheticScore, signals, "video");

  return {
    status: "complete",
    mediaType: "video",
    metadata,
    generatedAt: new Date().toISOString(),
    frameCount: sampled.length,
    verdict: risk.verdict,
    confidence: risk.confidence,
    recommendedAction: risk.recommendedAction,
    riskLevel: risk.riskLevel,
    scores: {
      syntheticLikelihood: round(syntheticScore),
      ...signals
    },
    detectorVersion: "local-baseline-2.0",
    plugins: risk.plugins,
    interpretation: explainScore(syntheticScore),
    notes: [
      "This is a transparent baseline for labeled synthetic test clips.",
      "Use additional consented datasets before making claims about real-world accuracy.",
      "Do not use detector testing to optimize deceptive bypass behavior."
    ]
  };
}

function analyzeImageFrame(frame, metadata = {}) {
  if (!frame) {
    return {
      status: "not_enough_image_data",
      message: "Choose an image before analyzing.",
      metadata,
      scores: {}
    };
  }

  const noise = localNoiseEstimate(frame.data.data, frame.width, frame.height);
  const edges = edgeEnergy(frame.data.data, frame.width, frame.height);
  const watermark = watermarkPresence(frame);
  const compression = blockinessEstimate(frame.data.data, frame.width, frame.height);
  const flatness = colorFlatness(frame.data.data);
  const syntheticScore = clamp(
    normalize(noise, 3, 24) * 0.18 +
      normalize(edges, 7, 42) * 0.18 +
      watermark * 0.28 +
      normalize(compression, 1, 18) * 0.18 +
      flatness * 0.18,
    0,
    1
  );
  const signals = {
    localNoiseSignal: round(normalize(noise, 3, 24)),
    edgeSignal: round(normalize(edges, 7, 42)),
    compressionSignal: round(normalize(compression, 1, 18)),
    flatColorSignal: round(flatness),
    watermarkPresence: round(watermark)
  };
  const risk = buildRiskModel(syntheticScore, signals, "image");

  return {
    status: "complete",
    mediaType: "image",
    metadata,
    generatedAt: new Date().toISOString(),
    frameCount: 1,
    verdict: risk.verdict,
    confidence: risk.confidence,
    recommendedAction: risk.recommendedAction,
    riskLevel: risk.riskLevel,
    scores: {
      syntheticLikelihood: round(syntheticScore),
      ...signals
    },
    detectorVersion: "local-baseline-2.0",
    plugins: risk.plugins,
    interpretation: explainScore(syntheticScore),
    notes: [
      "Single-image analysis is weaker than video analysis because there is no motion signal.",
      "Use this score as a triage signal, not as proof that media is real or fake.",
      "For stronger results, compare against consented reference data and trained detectors."
    ]
  };
}

function temporalSmoothness(frames) {
  const diffs = [];
  for (let i = 1; i < frames.length; i += 1) {
    diffs.push(meanAbsDifference(frames[i - 1].data.data, frames[i].data.data, 32));
  }
  const variance = statisticalVariance(diffs);
  return clamp(1 - variance / 900, 0, 1);
}

function noiseConsistency(frames) {
  const values = frames.map((frame) => localNoiseEstimate(frame.data.data, frame.width, frame.height));
  const variance = statisticalVariance(values);
  return clamp(1 - variance / 180, 0, 1);
}

function edgeStability(frames) {
  const values = frames.map((frame) => edgeEnergy(frame.data.data, frame.width, frame.height));
  const variance = statisticalVariance(values);
  return clamp(1 - variance / 700, 0, 1);
}

function watermarkPresence(frame) {
  const { data, width, height } = frame;
  const pixels = data.data;
  const sampleRegions = [
    {
      x0: Math.floor(width * 0.014),
      y0: Math.floor(height * 0.025),
      x1: Math.floor(width * 0.334),
      y1: Math.floor(height * 0.134)
    },
    {
      x0: Math.floor(width * 0.728),
      y0: Math.floor(height * 0.919),
      x1: Math.floor(width * 0.986),
      y1: Math.floor(height * 0.972)
    }
  ];
  let darkOrRed = 0;
  let total = 0;
  for (const region of sampleRegions) {
    for (let y = region.y0; y < region.y1; y += 4) {
      for (let x = region.x0; x < region.x1; x += 4) {
        const i = (y * width + x) * 4;
        const red = pixels[i];
        const green = pixels[i + 1];
        const blue = pixels[i + 2];
        if (red > 150 && green < 110 && blue < 110) darkOrRed += 1;
        if (red < 80 && green < 80 && blue < 80) darkOrRed += 1;
        total += 1;
      }
    }
  }
  return clamp(darkOrRed / Math.max(total * 0.35, 1), 0, 1);
}

function overlayConsistency(frames) {
  const first = frames[0];
  const last = frames.at(-1);
  const topRegion = {
    x0: Math.floor(first.width * 0.019),
    y0: Math.floor(first.height * 0.033),
    x1: Math.floor(first.width * 0.305),
    y1: Math.floor(first.height * 0.092)
  };
  const firstTop = regionAverage(
    first.data.data,
    first.width,
    topRegion.x0,
    topRegion.y0,
    topRegion.x1,
    topRegion.y1
  );
  const lastTop = regionAverage(
    last.data.data,
    last.width,
    topRegion.x0,
    topRegion.y0,
    topRegion.x1,
    topRegion.y1
  );
  const diff = Math.abs(firstTop - lastTop);
  return clamp(1 - diff / 45, 0, 1);
}

function meanAbsDifference(a, b, stride) {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < a.length; i += stride * 4) {
    sum += Math.abs(a[i] - b[i]);
    sum += Math.abs(a[i + 1] - b[i + 1]);
    sum += Math.abs(a[i + 2] - b[i + 2]);
    count += 3;
  }
  return sum / count;
}

function localNoiseEstimate(data, width, height) {
  let sum = 0;
  let count = 0;
  for (let y = 2; y < height - 2; y += 16) {
    for (let x = 2; x < width - 2; x += 16) {
      const center = luminanceAt(data, width, x, y);
      const neighbors =
        luminanceAt(data, width, x - 1, y) +
        luminanceAt(data, width, x + 1, y) +
        luminanceAt(data, width, x, y - 1) +
        luminanceAt(data, width, x, y + 1);
      sum += Math.abs(center - neighbors / 4);
      count += 1;
    }
  }
  return sum / Math.max(count, 1);
}

function edgeEnergy(data, width, height) {
  let sum = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 14) {
    for (let x = 1; x < width - 1; x += 14) {
      const gx = luminanceAt(data, width, x + 1, y) - luminanceAt(data, width, x - 1, y);
      const gy = luminanceAt(data, width, x, y + 1) - luminanceAt(data, width, x, y - 1);
      sum += Math.sqrt(gx * gx + gy * gy);
      count += 1;
    }
  }
  return sum / Math.max(count, 1);
}

function blockinessEstimate(data, width, height) {
  let sum = 0;
  let count = 0;
  for (let y = 8; y < height - 1; y += 8) {
    for (let x = 1; x < width - 1; x += 8) {
      sum += Math.abs(luminanceAt(data, width, x, y) - luminanceAt(data, width, x, y - 1));
      count += 1;
    }
  }
  for (let x = 8; x < width - 1; x += 8) {
    for (let y = 1; y < height - 1; y += 8) {
      sum += Math.abs(luminanceAt(data, width, x, y) - luminanceAt(data, width, x - 1, y));
      count += 1;
    }
  }
  return sum / Math.max(count, 1);
}

function colorFlatness(data) {
  const buckets = new Map();
  let samples = 0;
  for (let i = 0; i < data.length; i += 4 * 24) {
    const red = data[i] >> 5;
    const green = data[i + 1] >> 5;
    const blue = data[i + 2] >> 5;
    const key = `${red}-${green}-${blue}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
    samples += 1;
  }
  const dominant = Math.max(...buckets.values());
  return clamp((dominant / Math.max(samples, 1) - 0.08) / 0.32, 0, 1);
}

function regionAverage(data, width, x0, y0, x1, y1) {
  let sum = 0;
  let count = 0;
  for (let y = y0; y < y1; y += 4) {
    for (let x = x0; x < x1; x += 4) {
      sum += luminanceAt(data, width, x, y);
      count += 1;
    }
  }
  return sum / Math.max(count, 1);
}

function luminanceAt(data, width, x, y) {
  const i = (y * width + x) * 4;
  return data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
}

function statisticalVariance(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

function explainScore(score) {
  if (score >= 0.75) return "Likely synthetic under this lab's transparent baseline.";
  if (score >= 0.45) return "Mixed signals; collect more frames or run stronger detector plugins.";
  return "Low synthetic signal under this baseline.";
}

function buildRiskModel(score, signals, mediaType) {
  const highSignals = Object.entries(signals)
    .filter(([, value]) => value >= 0.7)
    .map(([name, value]) => ({ name, value }));
  const lowSignals = Object.entries(signals)
    .filter(([, value]) => value <= 0.3)
    .map(([name, value]) => ({ name, value }));
  const confidence = clamp(Math.abs(score - 0.5) * 1.65 + highSignals.length * 0.045, 0.22, 0.97);
  let verdict = "Needs Review";
  let riskLevel = "medium";
  let recommendedAction = "Send to human review and compare against trusted source material.";

  if (score >= 0.82) {
    verdict = "Likely Synthetic";
    riskLevel = "high";
    recommendedAction = "Treat as synthetic until verified by provenance, source records, or manual review.";
  } else if (score >= 0.62) {
    verdict = "Suspicious";
    riskLevel = "elevated";
    recommendedAction = "Do not rely on this media alone; request provenance or a second detector pass.";
  } else if (score <= 0.28) {
    verdict = "Low Synthetic Signal";
    riskLevel = "low";
    recommendedAction = "No strong synthetic signal found by this baseline; keep normal verification steps.";
  }

  return {
    verdict,
    riskLevel,
    confidence: round(confidence),
    recommendedAction,
    plugins: buildPluginReport(signals, highSignals, lowSignals, mediaType)
  };
}

function buildPluginReport(signals, highSignals, lowSignals, mediaType) {
  const pluginNames = {
    temporalSmoothness: "Temporal Motion Consistency",
    noiseConsistency: "Noise Pattern Consistency",
    edgeStability: "Edge Stability",
    watermarkPresence: "Provenance Overlay",
    overlayConsistency: "Overlay Consistency",
    localNoiseSignal: "Local Noise Signal",
    edgeSignal: "Still Edge Signal",
    compressionSignal: "Compression Block Signal",
    flatColorSignal: "Flat Color Distribution"
  };

  return Object.entries(signals).map(([name, value]) => {
    let status = "neutral";
    if (value >= 0.7) status = "flag";
    if (value <= 0.3) status = "weak";
    return {
      id: name,
      name: pluginNames[name] || name,
      mediaType,
      score: value,
      status,
      summary: summarizePlugin(name, value, highSignals, lowSignals)
    };
  });
}

function summarizePlugin(name, value) {
  if (value >= 0.7) return `${name} produced a strong synthetic-media signal.`;
  if (value <= 0.3) return `${name} produced a weak synthetic-media signal.`;
  return `${name} produced a mixed signal.`;
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function normalize(value, low, high) {
  return clamp((value - low) / (high - low), 0, 1);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

window.analyzeFrames = analyzeFrames;
window.analyzeImageFrame = analyzeImageFrame;
