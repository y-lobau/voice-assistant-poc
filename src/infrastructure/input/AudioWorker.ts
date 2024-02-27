import { spawn } from "child_process";
import { on } from "events";
import fs from "fs";
import recorder from "node-record-lpcm16";

export class AudioWorker {
  private recording = null;
  private isRecording = false;
  private stopped = false;
  private silenceStart = null;
  private silenceThreshold = 240; // Adjusted for silence detection
  private silenceTimeout = 5000; // Duration of silence before stopping
  private outputFile = "./output.mp3"; // The path for the output file
  private ffmpeg;

  constructor(private console) {}

  public recordMic(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.record(resolve, reject);
    });
  }

  private record(resolve, reject): void {
    this.setupFFmpeg(this.outputFile, () => resolve(this.outputFile), reject);

    this.recording = recorder.record({
      sampleRate: 16000,
      threshold: 0,
      verbose: false,
      recorder: "sox",
    });

    this.recording.stream().on("error", (err) => {
      reject(err);
      this.console.error(err);
    });

    this.recording
      .stream()
      .on("data", (data) => this.handleData(data, resolve, reject));

    this.isRecording = true;
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

    const volume = this.calculateVolume(data);
    this.console.debug(`Volume: ${volume}`);

    if (volume > this.silenceThreshold && !this.isRecording) {
      this.isRecording = true;
      this.console.info("Detected speech, starting recording...");
      this.recording.stream().pipe(this.ffmpeg.stdin);
    } else if (this.isRecording) {
      if (!this.silenceStart) {
        this.silenceStart = Date.now();
      } else if (Date.now() - this.silenceStart > this.silenceTimeout) {
        this.console.info("Silence detected, stopping recording...");
        this.stop();

        resolve(this.isRecording ? this.outputFile : null);
      }
    }
  }

  private calculateVolume(data): number {
    let sum = 0;
    for (let i = 0; i < data.length; i += 2) {
      let sample = data.readInt16LE(i);
      sum += sample * sample;
    }
    return Math.sqrt(sum / (data.length / 2));
  }

  public stop() {
    if (this.recording) {
      this.recording.stop();
      this.ffmpeg.stdin.end();
      this.console.info("Recording stopped.");
      this.stopped = true;
    }
  }

  public cleanup() {
    // Remove the output file after recording
    if (fs.existsSync(this.outputFile)) {
      fs.unlink(this.outputFile, (err) => {
        if (err) {
          this.console.error(
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
