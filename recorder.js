class CanvasRecorder {
  constructor(canvas, onClipReady) {
    this.canvas = canvas;
    this.onClipReady = onClipReady;
    this.recorder = null;
    this.chunks = [];
  }

  isSupported() {
    return Boolean(this.canvas.captureStream && window.MediaRecorder);
  }

  start(seconds) {
    if (!this.isSupported()) {
      throw new Error("Recording is not supported by this browser.");
    }

    this.chunks = [];
    const stream = this.canvas.captureStream(30);
    const mimeType = this.pickMimeType();
    const options = mimeType ? { mimeType } : undefined;
    this.recorder = new MediaRecorder(stream, options);

    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };

    this.recorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: this.recorder.mimeType });
      this.onClipReady(blob);
    };

    this.recorder.start();
    window.setTimeout(() => this.stop(), seconds * 1000);
  }

  stop() {
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop();
    }
  }

  pickMimeType() {
    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm"
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }
}

window.CanvasRecorder = CanvasRecorder;
