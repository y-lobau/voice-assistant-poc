import { spawn } from "child_process";
import fs from "fs";
import { PvRecorder } from "@picovoice/pvrecorder-node";

import { IConsole } from "../../../../core/interfaces/IConsole.js";
import { Silence } from "./ManualSilence.js";

export class AudioWorker {
  private recording = null;
  private isRecording = false;
  private stopped = false;

  private outputFile = "./output.mp3"; // The path for the output file
  private ffmpeg;
  private silence: Silence;

  constructor(private console: IConsole) {
    this.cleanup();
    this.silence = new Silence(console);
  }

  public recordMic(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      return this.record(resolve, reject);
    });
  }

  private async record(resolve, reject): Promise<void> {
    this.setupFFmpeg(this.outputFile, () => resolve(this.outputFile), reject);

    const frameLength = 512;
    const recorder = new PvRecorder(frameLength);
    recorder.start();

    while (recorder.isRecording) {
      const frame = await recorder.read();
      this.handleData(frame, resolve, reject);
    }

    this.console.info(
      'Recording started. Press "q" then "Enter" in the main application to stop.'
    );
  }

  private setupFFmpeg(
    filePath: string,
    onComplete: () => {},
    onError: (err) => {}
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
      this.console.info(`FFmpeg stdout: ${data}`)
    );
    this.ffmpeg.stderr.on("data", (data) =>
      this.console.errorStr(`FFmpeg stderr: ${data}`)
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

  private handleData(data, resolve, reject) {
    if (this.stopped) {
      return;
    }

    const volume = this.silence.volume(data);
    this.console.debug(`Volume: ${volume}`);

    if (!this.silence.isSilence(volume)) {
      this.silence.resetStarted();

      if (!this.isRecording) {
        this.console.debug("Voice detected, writing to FFmpeg...");
        this.isRecording = true;
        this.recording.stream().pipe(this.ffmpeg.stdin);
      }
    } else if (!this.silence.isStarted()) {
      this.silence.setStarted();
    } else if (this.silence.isTimedOut() && this.isRecording) {
      this.console.info("Silence detected, stopping recording...");
      const file = this.isRecording ? this.outputFile : null;
      this.stop().then(() => resolve(file));
    }
  }

  private stop(): Promise<string | null> {
    this.stopped = true;

    if (this.recording) {
      this.recording.stop();

      return new Promise((resolve) => {
        setTimeout(() => {
          this.ffmpeg.stdin.end();
          this.console.info("Recording stopped.");

          resolve(this.isRecording ? this.outputFile : null);
        }, 100);
      });
    }
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
