import { spawn } from "child_process";
import fs from "fs";
import wav from "wav";

import { IConsole } from "../../../../core/interfaces/IConsole.js";
import { Porcupine, BuiltInKeyword } from "./porcupine/index.js";
import { Omnibus } from "@hypersphere/omnibus";
import { Events } from "../../../../core/interfaces/Events.js";
import { SpeechRound } from "../../../../core/SpeechRound.js";
import { VoiceRecorder } from "../VoiceRecorder.js";

export class AudioWorker {
  private isRecording = false;
  private cardName = "seeed-2mic-voicecard";

  private outputFile = "./output.mp3"; // The path for the output file
  private ffmpeg;
  private recorder: VoiceRecorder;

  private standbyMode = false;

  // Is used for debugging purposes to check what is being recorded
  private debugFile: wav.FileWriter;
  private debugFilename = "debug.wav";

  private porcupine: Porcupine;
  private recordRejector;
  private speechRound: SpeechRound;

  constructor(
    private console: IConsole,
    private eventBus: Omnibus<Events>,
    private debugWavFile: boolean = false
  ) {
    this.console.debug("Initializing AudioWorker");
  }

  public async init() {
    await Promise.all([this.initVoiceRecorder(), this.initPorcupine()]);

    if (this.debugWavFile) {
      this.debugFile = new wav.FileWriter(this.debugFilename, {
        channels: 1,
        sampleRate: this.porcupine.sampleRate,
        bitDepth: 16,
      });
    }
  }

  private async initVoiceRecorder() {
    try {
      this.recorder = new VoiceRecorder(
        this.console,
        this.porcupine.frameLength,
        this.cardName
      );
      await this.recorder.init();
      this.recorder.on("audio", this.handleAudioData);
    } catch (err) {
      this.console.errorStr(`Error creating recorder: ${err}`);
    }
  }

  private initPorcupine(): Promise<void> {
    return new Promise((resolve, reject) => {
      Porcupine.loader.once("ready", () => {
        this.console.debug("Porcupine loaded");
        this.porcupine = Porcupine.create([BuiltInKeyword.Bumblebee], [0.5]);
        resolve();
      });
    });
  }

  private setupFFmpeg(
    filePath: string,
    onComplete: () => void,
    onError: (err) => void
  ): void {
    this.console.debug("Initializing FFmpeg...");

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
    this.ffmpeg.stdout.on(
      "data",
      (data) => {}
      // this.console.debug(`FFmpeg stdout: ${data}`)
    );
    this.ffmpeg.stderr.on(
      "data",
      (data) => {}
      // this.console.debug(`FFmpeg stderr: ${data}`)
    );
    this.ffmpeg.stdin.on("end", () => {
      {
      }
      this.console.debug("FFmpeg stdin stream ended.");
    });

    this.ffmpeg.on("close", () => {
      this.console.debug("FFmpeg process exited.");
      onComplete();
    });
    this.ffmpeg.on("error", (err) => {
      // onError(err);
    });

    this.console.debug("Initializing FFmpeg...done");
  }

  private resolveOutput(resolveCallback) {
    const file = this.speechRound.speechDetected ? this.outputFile : null;

    this.eventBus.trigger("voiceRecordingFinished");
    resolveCallback(file);
  }

  private setRecordingStarted() {
    this.isRecording = true;
    this.eventBus.trigger("voiceInputStarted");
  }

  private setStandbyMode() {
    if (!this.standbyMode) {
      this.standbyMode = true;
      this.isRecording = false;
      this.eventBus.trigger("voiceStandbyStarted");
    }
  }

  private finilizeSession(): void {
    if (!this.isRecording) {
      return;
    }

    this.console.debug("Finilizing session...");

    this.recorder.stop();
    this.ffmpeg.stdin.end();
    this.console.debug("Finilizing session... done");
  }

  private handleAudioData = async ({ speaking, audio }) => {
    // this.console.debug(`speaking: ${speaking}`);

    try {
      if (!this.isRecording) {
        this.listenToWakeWord(audio);
      } else if (speaking) {
        this.handleVoice(audio);
      } else if (!this.speechRound.isSilenceTimedOut) {
        this.speechRound.silence();
      } else {
        this.handleSilenceTimeout();
      }
    } catch (error) {
      this.recordRejector(error);
    }
  };

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

  private handleVoice(audio: Int16Array) {
    this.speechRound.speaking(audio);

    // Streaming audio to FFmpeg
    this.console.debug(`Streaming voice to FFmpeg...`);
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

  private handleSilenceTimeout() {
    this.console.debug(
      `Silence ${
        this.speechRound.silenceTimeout / 1000
      }s timed out. Stopping recording`
    );
    this.eventBus.trigger("voiceInputFinished");

    // If no input detected - restart listening
    this.console.debug(
      `Voice of length ${this.speechRound.speechLengthMs}ms detected`
    );
    if (this.speechRound.speechDetected) {
      this.finilizeSession();
    } else {
      this.console.debug("Restarting recording...");
      this.reset();
    }
  }

  private reset() {
    this.cleanupAllFiles();
    this.isRecording = false;
    this.standbyMode = false;
    this.speechRound = SpeechRound.new();
  }

  public async recordInput(listenOnStart: boolean): Promise<string> {
    this.reset();

    // Recording works in two phases: first, without hotword detection, then with it, if no input detected
    if (listenOnStart) {
      this.console.debug(
        "listenOnStart is true. Starting recording immediately."
      );
      this.setRecordingStarted();
    }

    await this.initVoiceRecorder();

    return new Promise<string>(async (resolve, reject) => {
      this.setupFFmpeg(
        this.outputFile,
        () => this.resolveOutput(resolve),
        reject
      );

      this.recordRejector = reject;

      this.console.debug("recorder.start()");
      this.recorder.start(reject);
      this.console.debug("recorder.start()... done");
    });
  }

  public cleanup() {
    this.console.info("Cleaning up AudioWorker...");
    // Remove the output file after recording
    if (this.porcupine) this.porcupine.release();
    this.cleanupFiles([this.outputFile]);
  }
}
