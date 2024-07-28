import { execSync, spawn } from "child_process";
import fs from "fs";
import { PvRecorder } from "@picovoice/pvrecorder-node";

import { IConsole } from "../../../../core/interfaces/IConsole.js";
import { Porcupine, BuiltInKeyword } from "./porcupine/index.js";
import { VoiceDetector } from "./VoiceDetector.js";
import { Omnibus } from "@hypersphere/omnibus";
import { Events } from "../../../../core/interfaces/Events.js";

export class AudioWorker {
  private isRecording = false;
  private stopped = false;
  private voiceDetector: VoiceDetector;
  private cardName = "seeed-2mic-voicecard";

  private outputFile = "./output.mp3"; // The path for the output file
  private ffmpeg;
  private frameLength = 512;
  private recorder;

  private porcupine: Porcupine;
  private standbyFlag = false;
  private connected = false;

  constructor(
    private console: IConsole,
    apiKey: string,
    private eventBus: Omnibus<Events>
  ) {
    this.cleanup();
    this.voiceDetector = new VoiceDetector(0.8, apiKey);

    this.connectPorcupine();

    let index = -1;
    try {
      index = this.getCaptureDeviceIndexByName(this.cardName);
    } catch (err) {
      this.console.errorStr(
        `Error reading capture device index. Using default.\n${err}`
      );
    }
    this.console.info(`device index: ${index}`);

    try {
      this.recorder = new PvRecorder(this.frameLength, index);
    } catch (err) {
      this.console.errorStr(`Error creating recorder: ${err}`);
    }
  }

  private getCaptureDeviceIndexByName(deviceName): number {
    const devices = PvRecorder.getAvailableDevices();
    return devices.findIndex(device => device.includes(deviceName));
  }

  private resolveOutput(resolveCallback) {
    const file =
      this.isRecording && this.voiceDetector.voiceDetected
        ? this.outputFile
        : null;

    this.eventBus.trigger("voiceRecordingFinished");
    resolveCallback(file);
  }

  private connectPorcupine(): void {
    if (!this.connected) {
      if (Porcupine.isLoaded()) {
        this.connected = true;
      } else {
        Porcupine.loader.once("ready", () => {
          this.connected = true;
          this.porcupine = Porcupine.create([BuiltInKeyword.Bumblebee], [0.5]);
        });
      }
    }
  }

  public recordInput(listenOnStart: boolean): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      this.setupFFmpeg(
        this.outputFile,
        () => this.resolveOutput(resolve),
        reject
      );
      this.recorder.start();

      // Recording works in two phases: first, without hotword detection, then with it, if no input detected
      if (listenOnStart) this.setRecordingStarted();

      while (this.recorder.isRecording) {
        const frame = await this.recorder.read();
        this.handleData(frame, reject);
      }
    });
  }

  private setRecordingStarted() {
    this.standbyFlag = false;
    this.isRecording = true;
    this.eventBus.trigger("voiceInputStarted");
  }

  private setupFFmpeg(
    filePath: string,
    onComplete: () => void,
    onError: (err) => void
  ): void {
    this.ffmpeg = spawn("ffmpeg", [
      "-f",
      "s16le",
      "-ar",
      "16000",
      "-ac",
      "1",
      "-i",
      "-",
      "-codec:a",
      "libmp3lame",
      "-qscale:a",
      "2",
      "-hide_banner",
      filePath,
    ]);

    // Debugging FFmpeg's output
    this.ffmpeg.stdout.on("data", (data) =>
      this.console.debug(`FFmpeg stdout: ${data}`)
    );
    this.ffmpeg.stderr.on("data", (data) =>
      this.console.debug(`FFmpeg stderr: ${data}`)
    );
    this.ffmpeg.stdin.on("end", () => {
      this.console.debug("FFmpeg stdin stream ended.");
    });

    this.ffmpeg.on("close", () => {
      this.console.debug("FFmpeg process exited.");
      onComplete();
    });
    this.ffmpeg.on("error", (err) => {
      onError(err);
    });
  }

  private setStandbyMode() {
    if (this.standbyFlag) return;

    this.standbyFlag = true;
    this.eventBus.trigger("voiceStandbyStarted");
  }

  private handleData(data, reject) {
    try {
      if (this.porcupine && !this.isRecording) {
        const keywordIndex = this.porcupine.process(data);
        if (keywordIndex >= 0) {
          this.console.stopLoading();
          this.console.debug("hot word detected. Recording started.");
          this.eventBus.trigger("voiceInputStarted");
          this.setRecordingStarted();
        } else {
          this.setStandbyMode();
          return;
        }
      } else if (this.voiceDetector.silenceThresholdReached(data)) {
        this.console.stopLoading();
        this.console.debug("Silence threshold reached. Stopping recording");

        // If no input detected - restart listening
        if (!this.voiceDetector.voiceDetected) {
          this.isRecording = false;
          this.voiceDetector.reset();
          this.eventBus.trigger("voiceInputFinished");
          return;
        }

        this.stop();
      } else {
        const buffer = Buffer.from(
          data.buffer,
          data.byteOffset,
          data.byteLength
        );
        this.ffmpeg.stdin.write(buffer);
      }
    } catch (error) {
      reject(error);
    }
  }

  private stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.stopped) {
        resolve();
        return;
      }

      this.stopped = true;
      this.recorder.stop();
      this.porcupine.release();
      this.ffmpeg.stdin.end();
    });
  }

  public cleanup() {
    // Remove the output file after recording
    if (fs.existsSync(this.outputFile)) {
      fs.unlink(this.outputFile, (err) => {
        if (err) {
          this.console.errorStr(
            `Failed to delete file at ${this.outputFile}: ${err}`
          );
        } else {
          this.console.debug(
            `File at ${this.outputFile} deleted successfully.`
          );
        }
      });
    }
  }
}
