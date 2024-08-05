import { IConsole } from "../../../core/interfaces/IConsole";
import { PvRecorder } from "@picovoice/pvrecorder-node";
import { execSync } from "child_process";
import EventEmitter from "events";
import vad, { FrameProcessor } from "@ricky0123/vad-node";

export class VoiceRecorder extends EventEmitter {
  private vadInstance: vad.NonRealTimeVAD | null;
  private recorder: PvRecorder;
  private vadProbabilityThreshold = 0.7;

  constructor(
    private console: IConsole,
    private frameLength: number,
    private cardName: string
  ) {
    super();
    const deviceIndex = this.getCaptureDeviceIndexByName(this.cardName);
    this.console.info(`Using device index: ${deviceIndex}`);

    try {
      this.recorder = new PvRecorder(this.frameLength, deviceIndex);
    } catch (err) {
      this.console.errorStr(`Error creating recorder: ${err}`);
    }
  }

  private getCaptureDeviceIndexByName(deviceName): number {
    const devices = PvRecorder.getAvailableDevices();
    return devices.findIndex((device) => device.includes(deviceName));
  }

  private async voiceDetected(audio: Int16Array): Promise<boolean> {
    const floatArray = new Float32Array(audio.length);
    for (let i = 0; i < audio.length; i++)
      floatArray[i] = audio[i] / (audio[i] >= 0 ? 32767 : 32768);

    const probs = await (
      this.vadInstance.frameProcessor as FrameProcessor
    ).modelProcessFunc(floatArray);

    return probs.isSpeech >= this.vadProbabilityThreshold;
  }

  public async init() {
    try {
      this.vadInstance = await vad.NonRealTimeVAD.new();
    } catch (err) {
      this.console.errorStr(`Error creating recorder: ${err}`);
    }
  }

  public async start(reject): Promise<void> {
    this.recorder.start();

    while (this.recorder.isRecording) {
      const frame = await this.recorder.read();
      const voiceDetected = await this.voiceDetected(frame);

      this.emit("audio", { speaking: voiceDetected, audio: frame });
    }
  }

  public stop(): void {
    this.recorder.stop();
  }
}
