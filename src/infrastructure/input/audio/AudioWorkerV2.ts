import { execSync, spawn } from "child_process";
import fs from "fs";
import { SpeechRecorder, devices } from "speech-recorder";

import { IConsole } from "../../../core/interfaces/IConsole.js";
import { Porcupine, BuiltinKeyword } from "@picovoice/porcupine-node";
import { Omnibus } from "@hypersphere/omnibus";
import { Events } from "../../../core/interfaces/Events.js";
import wav from "wav";
import { Silence } from "./Silence.js";

export class AudioWorkerV2 {
  private isRecordingStarted = false;
  private voiceRecorded = false;
  private standbyFlag = false;
  private silence: Silence;

  private cardName = "seeed-2mic-voicecard";

  private outputFile = "./output.mp3"; // The path for the output file
  private ffmpeg;
  private recorder: SpeechRecorder;
  private speechProbabilityThreshold = 0.5;

  private fileWriter;

  private porcupine: Porcupine;
  private recordRejector;

  constructor(
    private console: IConsole,
    apiKey: string,
    private eventBus: Omnibus<Events>
  ) {
    this.cleanup();
    this.silence = new Silence();

    this.porcupine = new Porcupine(apiKey, [BuiltinKeyword.BLUEBERRY], [0.5]);
    console.debug(
      `Porcupine version: ${this.porcupine.version}, sample rate: ${this.porcupine.sampleRate}, frame length: ${this.porcupine.frameLength}`
    );

    this.fileWriter = new wav.FileWriter("output.wav", {
      channels: 1,
      sampleRate: this.porcupine.sampleRate,
      bitDepth: 16,
    });

    console.debug("devices: ", devices());

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
      this.recorder = new SpeechRecorder({
        samplesPerFrame: this.porcupine.frameLength,
        device: index,
        onChunkStart: () => {
          console.debug(`${Date.now()} Voice started`);
        },
        onAudio: (data) => {
          this.handleAudioData(data);
        },
        onChunkEnd: () => {
          this.onVoiceEnded();
        },
      });
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
      throw new Error(`Error executing arecord -l: ${err.message}`);
    }
  }

  private resolveOutput(resolveCallback) {
    const file = this.voiceRecorded ? this.outputFile : null;

    this.eventBus.trigger("voiceRecordingFinished");
    resolveCallback(file);
  }

  private setRecordingStarted() {
    this.standbyFlag = false;
    this.isRecordingStarted = true;
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
    this.standbyFlag = true;
    this.isRecordingStarted = false;
    this.eventBus.trigger("voiceStandbyStarted");
  }

  private stopRecordingAndExit(): void {
    if (!this.isRecordingStarted) {
      return;
    }
    this.recorder.stop();
    this.ffmpeg.stdin.end();
  }

  private handleAudioData = async ({
    speaking,
    speech,
    probability,
    audio,
  }) => {
    // Maybe we don't need to check the 'probability'. It is used to optimize the output size (excluding non-speech parts).
    // It is not yet clear how do these 3 parts (speaking, speech, probability) correlate.
    // 'probability' may negatively influence the output by excluding some meaningful speech parts, let's test it.
    const speechDetected = speaking;
    // && speech;
    // && probability >= this.speechProbabilityThreshold;

    this.console.debug(
      `speaking: ${speaking}, speech: ${speech}, probability: ${probability}`
    );

    if (!speechDetected) return;

    this.fileWriter.write(
      Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength)
    );

    try {
      if (!this.isRecordingStarted) {
        const wakeWordDetected =
          this.porcupine.process(audio as Int16Array) !== -1;

        this.console.debug(`Checking for wake word: ${wakeWordDetected}`);

        if (wakeWordDetected) {
          this.console.debug("wake word detected. Recording started.");
          this.setRecordingStarted();
        } else if (!this.standbyFlag) {
          this.setStandbyMode();
        }
      } else {
        // Streaming audio to FFmpeg
        this.voiceRecorded = true;
        this.console.debug("Streaming audio to FFmpeg....");
        const buffer = Buffer.from(
          audio.buffer,
          audio.byteOffset,
          audio.byteLength
        );
        this.ffmpeg.stdin.write(buffer);
      }
    } catch (error) {
      this.recordRejector(error);
    }
  };

  private onVoiceEnded() {
    console.debug(`${Date.now()} Voice ended`);

    if (!this.voiceRecorded) {
      this.isRecordingStarted = false;
      return;
    }

    if (this.silence.isTimedOut() && this.voiceRecorded) {
      console.debug("Silence timeout reached. Stopping recording.");
      this.stopRecordingAndExit();
    }

    if (this.voiceRecorded) {
      console.debug("Stopping recording and exiting AudioWorker");
      this.stopRecordingAndExit();
    } else this.setStandbyMode();
  }

  public recordInput(listenOnStart: boolean): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      this.setupFFmpeg(
        this.outputFile,
        () => this.resolveOutput(resolve),
        reject
      );

      // Recording works in two phases: first, without hotword detection, then with it, if no input detected
      if (listenOnStart) this.setRecordingStarted();

      this.recordRejector = reject;
      this.recorder.start();
    });
  }

  public cleanup() {
    // Remove the output file after recording
    if (this.porcupine) this.porcupine.release();
    if (fs.existsSync(this.outputFile)) {
      console.log("WAV file has been created");

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
