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
  private silence: Silence;

  private cardName = "seeed-2mic-voicecard";

  private outputFile = "./output.mp3"; // The path for the output file
  private ffmpeg;
  private recorder: SpeechRecorder;
  private speechProbabilityThreshold = 0.5;

  // How many frames of silence to wait before subsequent voice chunk is finalized.
  // This is used to prevent cutting off the last part of the voice chunk.
  // The value should be at least 1, because the last frame of the voice chunk is always silent.
  // I tested it and with 3 it seems to work fine.
  private framesOfSilence = 3;
  private standbyMode = false;

  // Is used for debugging purposes to check what is being recorded
  private debugFile: wav.FileWriter;
  private debugFilename = "debug.wav";

  private porcupine: Porcupine;
  private recordRejector;

  constructor(
    private console: IConsole,
    apiKey: string,
    private eventBus: Omnibus<Events>,
    private debugWavFile: boolean = false
  ) {
    this.cleanupAllFiles();
    this.silence = new Silence();

    this.porcupine = new Porcupine(apiKey, [BuiltinKeyword.BLUEBERRY], [0.5]);
    console.debug(
      `Porcupine version: ${this.porcupine.version}, sample rate: ${this.porcupine.sampleRate}, frame length: ${this.porcupine.frameLength}`
    );

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
        consecutiveFramesForSilence: this.framesOfSilence,
        device: index,
        onChunkStart: () => {
          // console.debug("Voice started");
        },
        onAudio: (data) => {
          this.handleAudioData(data);
        },
        onChunkEnd: () => {
          // console.debug("Voice ended");
          this.silence.setStarted();
        },
      });
    } catch (err) {
      this.console.errorStr(`Error creating recorder: ${err}`);
    }

    if (this.debugWavFile) {
      this.debugWavFile = new wav.FileWriter(this.debugFilename, {
        channels: 1,
        sampleRate: this.porcupine.sampleRate,
        bitDepth: 16,
      });
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
    const file = this.silence.voiceInSessionDetected ? this.outputFile : null;

    this.eventBus.trigger("voiceRecordingFinished");
    resolveCallback(file);
  }

  private setRecordingStarted() {
    this.isRecordingStarted = true;
    this.silence.reset();
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
    if (!this.standbyMode) {
      this.standbyMode = true;
      this.isRecordingStarted = false;
      this.eventBus.trigger("voiceStandbyStarted");
    }
  }

  private finilizeSession(): void {
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
    const voiceDetected =
      speaking && speech && probability >= this.speechProbabilityThreshold;

    // this.console.debug(
    //   `speaking: ${speaking}, speech: ${speech}, probability: ${probability}`
    // );

    // TODO: handle case when file is too small and http 400 is returned

    try {
      if (!this.isRecordingStarted) {
        this.listenToWakeWord(audio);
      } else if (voiceDetected) {
        this.handleVoice(audio, probability);
      } else if (this.silence.isTimedOut()) {
        this.handleSilenceTimeout();
      } else {
        this.silence.setOrcontinue();
      }
    } catch (error) {
      this.recordRejector(error);
    }
  };

  private handleVoice(audio, probability) {
    // Streaming audio to FFmpeg
    this.silence.setVoiceDetected();
    this.console.debug(`Streaming audio with probability: ${probability}`);
    const buffer = Buffer.from(
      audio.buffer,
      audio.byteOffset,
      audio.byteLength
    );

    if (this.debugWavFile) {
      this.debugFile.write(
        Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength)
      );
    }
    this.ffmpeg.stdin.write(buffer);
  }

  private listenToWakeWord(audio) {
    const wakeWordDetected = this.porcupine.process(audio as Int16Array) !== -1;

    // this.console.debug(`Checking for wake word: ${wakeWordDetected}`);

    if (wakeWordDetected) {
      this.console.debug("wake word detected. Recording started.");
      this.setRecordingStarted();
    } else {
      this.setStandbyMode();
    }
  }

  private handleSilenceTimeout() {
    this.console.debug("Silence timed out. Stopping recording");
    this.eventBus.trigger("voiceInputFinished");

    // If no input detected - restart listening
    if (this.silence.voiceInSessionDetected) {
      this.finilizeSession();
    } else {
      this.isRecordingStarted = false;
      this.silence.reset();
    }
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

  private cleanupFiles(fileNames: string[]) {
    fileNames.forEach((fileName) => {
      if (fs.existsSync(fileName)) {
        fs.unlink(fileName, (err) => {
          if (err) {
            this.console.errorStr(
              `Failed to delete file at ${fileName}: ${err}`
            );
          } else {
            console.log(`File ${fileName} has been removed`);
          }
        });
      }
    });
  }

  private cleanupAllFiles() {
    this.cleanupFiles([this.outputFile, this.debugFilename]);
  }

  public cleanup() {
    // Remove the output file after recording
    if (this.porcupine) this.porcupine.release();
    this.cleanupAllFiles();
  }
}
