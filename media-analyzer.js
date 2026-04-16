class LocalMediaAnalyzer {
  constructor(input, preview) {
    this.input = input;
    this.preview = preview;
    this.file = null;
    this.objectUrl = "";
    this.sampleCanvas = document.createElement("canvas");
    this.sampleCanvas.width = 320;
    this.sampleCanvas.height = 180;
    this.sampleCtx = this.sampleCanvas.getContext("2d", { willReadFrequently: true });

    this.input.addEventListener("change", () => this.handleFileChange());
  }

  currentFile() {
    return this.file;
  }

  handleFileChange() {
    this.file = this.input.files[0] || null;
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.preview.innerHTML = "";

    if (!this.file) {
      this.preview.textContent = "No upload selected";
      return;
    }

    this.objectUrl = URL.createObjectURL(this.file);
    if (this.file.type.startsWith("image/")) {
      const image = document.createElement("img");
      image.alt = "Uploaded image preview";
      image.src = this.objectUrl;
      this.preview.append(image);
      return;
    }

    if (this.file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = this.objectUrl;
      video.controls = true;
      video.muted = true;
      video.playsInline = true;
      this.preview.append(video);
      return;
    }

    this.preview.textContent = "Unsupported file type";
  }

  async analyze() {
    if (!this.file) {
      return {
        status: "no_upload",
        message: "Choose an image or video first.",
        scores: {}
      };
    }

    if (this.file.type.startsWith("image/")) {
      const frame = await this.sampleImage(this.objectUrl);
      return window.analyzeImageFrame(frame, {
        source: this.file.name,
        mimeType: this.file.type,
        sizeBytes: this.file.size
      });
    }

    if (this.file.type.startsWith("video/")) {
      const frames = await this.sampleVideo(this.objectUrl);
      return window.analyzeFrames(frames, {
        source: this.file.name,
        mimeType: this.file.type,
        sizeBytes: this.file.size
      });
    }

    return {
      status: "unsupported_upload",
      message: "Use an image or video file.",
      scores: {}
    };
  }

  sampleImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        this.drawContain(image, image.naturalWidth, image.naturalHeight);
        resolve(this.currentFrame(0));
      };
      image.onerror = () => reject(new Error("Could not load the selected image."));
      image.src = url;
    });
  }

  sampleVideo(url) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const frames = [];
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";

      video.onloadedmetadata = async () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const sampleCount = Math.max(2, Math.min(30, Math.floor(duration * 2) || 2));
        const times = Array.from({ length: sampleCount }, (_, index) => {
          if (sampleCount === 1) return 0;
          return (duration * index) / (sampleCount - 1);
        });

        try {
          for (const time of times) {
            await this.seekVideo(video, Math.min(time, Math.max(duration - 0.05, 0)));
            this.drawContain(video, video.videoWidth, video.videoHeight);
            frames.push(this.currentFrame(video.currentTime));
          }
          resolve(frames);
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => reject(new Error("Could not load the selected video. Try MP4 or WebM."));
      video.src = url;
    });
  }

  seekVideo(video, time) {
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Video frame sampling timed out.")), 6000);
      video.onseeked = () => {
        window.clearTimeout(timeout);
        resolve();
      };
      video.currentTime = time;
    });
  }

  drawContain(source, sourceWidth, sourceHeight) {
    const targetWidth = this.sampleCanvas.width;
    const targetHeight = this.sampleCanvas.height;
    this.sampleCtx.fillStyle = "#101615";
    this.sampleCtx.fillRect(0, 0, targetWidth, targetHeight);

    const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    const x = (targetWidth - width) / 2;
    const y = (targetHeight - height) / 2;
    this.sampleCtx.drawImage(source, x, y, width, height);
  }

  currentFrame(t) {
    const imageData = this.sampleCtx.getImageData(0, 0, this.sampleCanvas.width, this.sampleCanvas.height);
    return {
      t,
      width: this.sampleCanvas.width,
      height: this.sampleCanvas.height,
      data: imageData
    };
  }
}

window.LocalMediaAnalyzer = LocalMediaAnalyzer;
