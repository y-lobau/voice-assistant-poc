import { IConsole } from "../../../core/interfaces/IConsole";
import { PvRecorder } from "@picovoice/pvrecorder-node";
import { execSync } from "child_process";
import EventEmitter from "events";
import vad from "@ricky0123/vad-node";
import { RealTimeVad } from "./RealTimeVad.js";

export class VoiceRecorder extends EventEmitter {
  private vadInstance: vad.NonRealTimeVAD;
  private recorder: PvRecorder;
  private vad: RealTimeVad;

  constructor(
    private console: IConsole,
    private frameLength: number,
    private cardName: string,
    private sampleRate: number = 16000
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
    try {
      const stdout = execSync("arecord -l").toString();
      const lines = stdout.split("\n");
      let deviceIndex: number = null;

      lines.forEach((line) => {
        if (line.includes(deviceName)) {
          const match = line.match(/card (\d+):/);
          if (match && match[1]) {
            deviceIndex = Number(match[1]);
          }
        }
      });

      if (deviceIndex !== null) {
        return deviceIndex;
      } else {
        throw new Error(`Device "${deviceName}" not found.`);
      }
    } catch (err) {
      this.console.errorStr(
        `Error executing arecord -l: ${err.message}. Using default device index -1.`
      );
      return -1;
    }
  }

  private async voiceDetected(audio: Int16Array): Promise<boolean> {
    const floatArray = new Float32Array(audio.length);
    for (let i = 0; i < audio.length; i++)
      floatArray[i] = audio[i] / (audio[i] >= 0 ? 32767 : 32768);

    return await this.vad.processAudio(floatArray);
  }

  public async init() {
    this.vad = await RealTimeVad.new({
      minBufferDuration: 0.5,
      maxBufferDuration: 0.5,
      silenceThreshold: 0.01,
    });
    this.vad.on("data", ({ audio, start, end }) => {
      this.console.debug(`VAD: ${start}, ${end}`);
    });

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
