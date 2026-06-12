export interface RecordedAudio {
  blob?: Blob;
  durationSeconds: number;
  mimeType?: string;
  sizeBytes?: number;
}

export async function ensureMicrophonePermission() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    throw new Error("当前浏览器不支持录音功能，请使用 Chrome 或 Edge。");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}

export class RecorderService {
  private recorder?: MediaRecorder;
  private chunks: BlobPart[] = [];
  private startedAt = 0;
  private pausedAt = 0;
  private pausedDuration = 0;

  private audioCtx?: AudioContext;
  private analyser?: AnalyserNode;
  private source?: MediaStreamAudioSourceNode;

  async start() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error("当前浏览器不支持录音功能，请使用 Chrome 或 Edge。");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    this.chunks = [];
    this.startedAt = Date.now();
    this.pausedAt = 0;
    this.pausedDuration = 0;

    // Set up AudioContext for visualization
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.audioCtx = new AudioContextClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.source = this.audioCtx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
    }

    this.recorder = new MediaRecorder(stream, { mimeType });
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.recorder.start();
  }

  pause() {
    if (this.recorder?.state === "recording") {
      this.pausedAt = Date.now();
      this.recorder.pause();
      this.audioCtx?.suspend();
    }
  }

  resume() {
    if (this.recorder?.state === "paused") {
      this.pausedDuration += Date.now() - this.pausedAt;
      this.pausedAt = 0;
      this.recorder.resume();
      this.audioCtx?.resume();
    }
  }

  getState() {
    return this.recorder?.state ?? "inactive";
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.analyser) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  async stop(): Promise<RecordedAudio> {
    const recorder = this.recorder;
    if (!recorder) return { durationSeconds: 0 };

    return new Promise((resolve) => {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        
        if (this.source) this.source.disconnect();
        if (this.audioCtx && this.audioCtx.state !== 'closed') {
          void this.audioCtx.close();
        }
        this.analyser = undefined;
        this.source = undefined;
        this.audioCtx = undefined;

        const blob = new Blob(this.chunks, { type: recorder.mimeType });
        const activePausedDuration = this.pausedAt ? Date.now() - this.pausedAt : 0;
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - this.startedAt - this.pausedDuration - activePausedDuration) / 1000)
        );

        this.recorder = undefined;
        this.chunks = [];
        this.pausedAt = 0;
        this.pausedDuration = 0;

        resolve({
          blob,
          durationSeconds,
          mimeType: recorder.mimeType,
          sizeBytes: blob.size
        });
      };

      if (recorder.state === "paused") recorder.resume();
      if (recorder.state !== "inactive") recorder.stop();
    });
  }
}
