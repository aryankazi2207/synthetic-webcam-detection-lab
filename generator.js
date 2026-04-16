const SCENE_TEXT = {
  plants: {
    room: "Indoor plants near a window",
    action: "Watering plant",
    colors: ["#e8f0e7", "#7fa66a", "#2f6b57"]
  },
  reading: {
    room: "Desk lamp and bookshelf",
    action: "Reading pages",
    colors: ["#edf0f3", "#57768f", "#c2a65b"]
  },
  coffee: {
    room: "Kitchen counter",
    action: "Making coffee",
    colors: ["#eef1ee", "#6b8f8d", "#9b6048"]
  },
  laundry: {
    room: "Laundry basket and sofa",
    action: "Folding laundry",
    colors: ["#f0f2f4", "#6e87a8", "#d86a57"]
  }
};

const PROMPT_SCENE_KEYWORDS = [
  {
    scene: "plants",
    words: ["plant", "plants", "watering", "garden", "houseplant", "flowers"]
  },
  {
    scene: "reading",
    words: ["reading", "book", "desk", "study", "homework", "paper"]
  },
  {
    scene: "coffee",
    words: ["coffee", "kitchen", "mug", "drink", "espresso", "tea"]
  },
  {
    scene: "laundry",
    words: ["laundry", "folding", "clothes", "shirt", "basket", "sofa"]
  }
];

const ARTIFACTS = {
  low: { noise: 10, jitter: 1, blocks: 0.08 },
  moderate: { noise: 20, jitter: 2, blocks: 0.16 },
  high: { noise: 36, jitter: 4, blocks: 0.28 }
};

class SyntheticWebcamGenerator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.sampleCanvas = document.createElement("canvas");
    this.sampleCanvas.width = 320;
    this.sampleCanvas.height = 180;
    this.sampleCtx = this.sampleCanvas.getContext("2d", { willReadFrequently: true });
    this.frameHistory = [];
    this.running = false;
    this.animationFrame = 0;
    this.settings = {
      scene: "plants",
      artifacts: "moderate",
      prompt: "woman watering plants in her house"
    };
  }

  start(settings) {
    this.settings = { ...this.settings, ...settings };
    this.running = true;
    this.frameHistory = [];
    this.startedAt = performance.now();
    this.drawLoop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
  }

  getFrames(limit = 90) {
    return this.frameHistory.slice(-limit);
  }

  drawLoop() {
    if (!this.running) return;
    const elapsed = (performance.now() - this.startedAt) / 1000;
    this.drawFrame(elapsed);
    this.captureFrame(elapsed);
    this.animationFrame = requestAnimationFrame(() => this.drawLoop());
  }

  drawFrame(t) {
    const { width, height } = this.canvas;
    const scene = SCENE_TEXT[this.settings.scene];
    const artifact = ARTIFACTS[this.settings.artifacts];
    const jitterX = Math.sin(t * 8.3) * artifact.jitter;
    const jitterY = Math.cos(t * 6.1) * artifact.jitter;

    this.ctx.save();
    this.ctx.translate(jitterX, jitterY);
    this.drawRoom(scene, t);
    this.drawPerson(scene, t);
    this.drawSceneObjects(scene, t);
    this.ctx.restore();

    this.applyWebcamArtifacts(artifact, t);
    this.drawOverlays(t, width, height, scene);
  }

  drawRoom(scene, t) {
    const { width, height } = this.canvas;
    const [wall, primary, secondary] = scene.colors;
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, wall);
    gradient.addColorStop(1, "#cfd8d3");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.fillStyle = "#dfe7e2";
    this.ctx.fillRect(0, height * 0.62, width, height * 0.38);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(width * 0.08, height * 0.12, width * 0.25, height * 0.34);
    this.ctx.fillStyle = "rgba(255,255,255,0.72)";
    for (let i = 0; i < 5; i += 1) {
      this.ctx.fillRect(width * (0.1 + i * 0.045), height * 0.12, 6, height * 0.34);
    }

    this.ctx.fillStyle = primary;
    this.ctx.fillRect(width * 0.58, height * 0.18, width * 0.28, 14);
    this.ctx.fillStyle = secondary;
    for (let i = 0; i < 4; i += 1) {
      this.ctx.fillRect(width * (0.6 + i * 0.055), height * 0.12, 34, 70 + Math.sin(t + i) * 4);
    }
  }

  drawPerson(scene, t) {
    const { width, height } = this.canvas;
    const centerX = width * 0.48 + Math.sin(t * 0.8) * 12;
    const baseY = height * 0.74;
    const armSwing = Math.sin(t * 2.2) * 0.45;

    this.ctx.fillStyle = "#2a2f31";
    this.roundRect(centerX - 55, baseY - 210, 110, 185, 36);
    this.ctx.fill();

    this.ctx.fillStyle = "#b97863";
    this.ctx.beginPath();
    this.ctx.arc(centerX, baseY - 260, 54, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "#26312e";
    this.ctx.beginPath();
    this.ctx.arc(centerX - 8, baseY - 282, 58, Math.PI * 1.05, Math.PI * 1.95);
    this.ctx.fill();

    this.ctx.strokeStyle = "#9d6655";
    this.ctx.lineWidth = 24;
    this.ctx.lineCap = "round";
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 48, baseY - 170);
    this.ctx.lineTo(centerX - 112, baseY - 112 + armSwing * 38);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(centerX + 48, baseY - 170);
    this.ctx.lineTo(centerX + 126, baseY - 118 - armSwing * 34);
    this.ctx.stroke();

    this.ctx.fillStyle = "#1b2422";
    this.ctx.beginPath();
    this.ctx.arc(centerX - 18, baseY - 264, 5, 0, Math.PI * 2);
    this.ctx.arc(centerX + 20, baseY - 264, 5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = "#7c4d43";
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(centerX + 2, baseY - 245, 18, 0.15, Math.PI - 0.15);
    this.ctx.stroke();

    this.ctx.fillStyle = "rgba(255,255,255,0.86)";
    this.ctx.font = "700 21px ui-sans-serif, system-ui";
    this.ctx.fillText(scene.action, centerX - 90, baseY - 18);
  }

  drawSceneObjects(scene, t) {
    if (this.settings.scene === "plants") this.drawPlants(t);
    if (this.settings.scene === "reading") this.drawDesk(t);
    if (this.settings.scene === "coffee") this.drawKitchen(t);
    if (this.settings.scene === "laundry") this.drawLaundry(t);
  }

  drawPlants(t) {
    const { width, height } = this.canvas;
    const potX = width * 0.68;
    const potY = height * 0.76;
    this.ctx.fillStyle = "#8e4f3a";
    this.roundRect(potX - 58, potY - 42, 116, 70, 8);
    this.ctx.fill();
    this.ctx.strokeStyle = "#2f734f";
    this.ctx.lineWidth = 10;
    for (let i = 0; i < 7; i += 1) {
      const angle = -1.1 + i * 0.36 + Math.sin(t + i) * 0.05;
      this.ctx.beginPath();
      this.ctx.moveTo(potX, potY - 48);
      this.ctx.lineTo(potX + Math.cos(angle) * 110, potY - 48 + Math.sin(angle) * 120);
      this.ctx.stroke();
    }
    this.ctx.strokeStyle = "#5ba3d0";
    this.ctx.lineWidth = 5;
    this.ctx.beginPath();
    this.ctx.moveTo(width * 0.59, height * 0.54);
    this.ctx.quadraticCurveTo(width * 0.63, height * 0.48, width * 0.69, height * 0.55 + Math.sin(t * 7) * 4);
    this.ctx.stroke();
  }

  drawDesk(t) {
    const { width, height } = this.canvas;
    this.ctx.fillStyle = "#77543f";
    this.ctx.fillRect(width * 0.28, height * 0.72, width * 0.5, 28);
    this.ctx.fillStyle = "#f6f0db";
    this.ctx.save();
    this.ctx.translate(width * 0.6, height * 0.64);
    this.ctx.rotate(Math.sin(t * 2) * 0.05);
    this.ctx.fillRect(-80, -40, 160, 80);
    this.ctx.restore();
  }

  drawKitchen(t) {
    const { width, height } = this.canvas;
    this.ctx.fillStyle = "#a3b1ad";
    this.ctx.fillRect(width * 0.18, height * 0.72, width * 0.65, 34);
    this.ctx.fillStyle = "#222";
    this.roundRect(width * 0.64, height * 0.58, 78, 116, 8);
    this.ctx.fill();
    this.ctx.strokeStyle = "rgba(255,255,255,0.55)";
    this.ctx.lineWidth = 5;
    for (let i = 0; i < 3; i += 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(width * 0.7 + i * 10, height * 0.54);
      this.ctx.bezierCurveTo(width * 0.68, height * (0.5 - i * 0.01), width * 0.73, height * 0.47, width * 0.71, height * 0.44);
      this.ctx.stroke();
    }
  }

  drawLaundry(t) {
    const { width, height } = this.canvas;
    this.ctx.fillStyle = "#728aa3";
    this.roundRect(width * 0.64, height * 0.64, 170, 92, 8);
    this.ctx.fill();
    this.ctx.fillStyle = "#f8f8f4";
    for (let i = 0; i < 4; i += 1) {
      this.ctx.save();
      this.ctx.translate(width * (0.45 + i * 0.035), height * (0.66 + Math.sin(t + i) * 0.01));
      this.ctx.rotate(Math.sin(t * 1.5 + i) * 0.15);
      this.ctx.fillRect(-34, -16, 68, 32);
      this.ctx.restore();
    }
  }

  applyWebcamArtifacts(artifact, t) {
    const { width, height } = this.canvas;
    const image = this.ctx.getImageData(0, 0, width, height);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * artifact.noise;
      data[i] += grain;
      data[i + 1] += grain;
      data[i + 2] += grain;
    }
    this.ctx.putImageData(image, 0, 0);

    this.ctx.fillStyle = `rgba(0, 0, 0, ${artifact.blocks})`;
    const block = 32;
    for (let y = 0; y < height; y += block) {
      for (let x = 0; x < width; x += block) {
        if ((x + y + Math.floor(t * 10) * block) % 128 === 0) {
          this.ctx.fillRect(x, y, block, block);
        }
      }
    }
  }

  drawOverlays(t, width, height, scene) {
    const now = new Date();
    const timestamp = now.toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    this.ctx.fillRect(18, 18, 410, 78);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "800 25px ui-sans-serif, system-ui";
    this.ctx.fillText("SYNTHETIC TRAINING VIDEO", 34, 50);
    this.ctx.font = "600 18px ui-sans-serif, system-ui";
    this.ctx.fillText(`${timestamp} | ${scene.room}`, 34, 78);

    const prompt = this.settings.prompt || "labeled synthetic webcam test";
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
    this.ctx.fillRect(18, 104, Math.min(620, width - 36), 34);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "700 16px ui-sans-serif, system-ui";
    this.ctx.fillText(`Prompt: ${prompt.slice(0, 66)}`, 34, 127);

    this.ctx.fillStyle = "rgba(210, 69, 61, 0.86)";
    this.ctx.fillRect(width - 348, height - 58, 330, 38);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "800 18px ui-sans-serif, system-ui";
    this.ctx.fillText("NOT A REAL WEBCAM FEED", width - 330, height - 33);

    this.ctx.strokeStyle = "rgba(255,255,255,0.22)";
    this.ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 4) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y + Math.sin(t * 8 + y) * 0.4);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }

  captureFrame(t) {
    if (this.frameHistory.length > 180) {
      this.frameHistory.shift();
    }
    this.sampleCtx.drawImage(this.canvas, 0, 0, this.sampleCanvas.width, this.sampleCanvas.height);
    const sample = this.sampleCtx.getImageData(0, 0, this.sampleCanvas.width, this.sampleCanvas.height);
    this.frameHistory.push({
      t,
      width: this.sampleCanvas.width,
      height: this.sampleCanvas.height,
      data: sample
    });
  }

  roundRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.arcTo(x + width, y, x + width, y + height, radius);
    this.ctx.arcTo(x + width, y + height, x, y + height, radius);
    this.ctx.arcTo(x, y + height, x, y, radius);
    this.ctx.arcTo(x, y, x + width, y, radius);
    this.ctx.closePath();
  }
}

window.SyntheticWebcamGenerator = SyntheticWebcamGenerator;
window.matchPromptToScene = function matchPromptToScene(prompt) {
  const normalized = String(prompt || "").toLowerCase();
  for (const candidate of PROMPT_SCENE_KEYWORDS) {
    if (candidate.words.some((word) => normalized.includes(word))) {
      return candidate.scene;
    }
  }
  return "plants";
};
