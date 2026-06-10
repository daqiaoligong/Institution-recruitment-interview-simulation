export class RecorderService {
  private recorder?: MediaRecorder;
  private chunks: BlobPart[] = [];
  private startedAt = 0;

  async start() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error("当前浏览器不支持录音功能");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    this.chunks = [];
    this.startedAt = Date.now();
    this.recorder = new MediaRecorder(stream, { mimeType });
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.recorder.start();
  }

  async stop(): Promise<{ blob?: Blob; durationSeconds: number; mimeType?: string }> {
    const recorder = this.recorder;
    if (!recorder) return { durationSeconds: 0 };

    return new Promise((resolve) => {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(this.chunks, { type: recorder.mimeType });
        const durationSeconds = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
        this.recorder = undefined;
        resolve({ blob, durationSeconds, mimeType: recorder.mimeType });
      };
      if (recorder.state !== "inactive") recorder.stop();
    });
  }
}
