import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { IConsole } from "../../core/interfaces/IConsole";

export class AudioPlayer {
  process: ChildProcessWithoutNullStreams;

  constructor(private console: IConsole) {}

  private spawnProcess(
    onPlayFinished: () => void,
    onPlayFailed: (error: Error) => void,
    args: string[] = ["-"]
  ) {
    this.process = spawn("mpg123", args);

    this.process.stderr.on("data", (data) => {
      this.console.errorStr(`stderr: ${data}`);
    });

    this.process.stdout.on("data", (data) => {
      this.console.debug(`stdout: ${data}`);
    });

    this.process.on("close", (code) => {
      if (code === 0) {
        this.console.debug("mpg123 finished playing the audio successfully.");
        onPlayFinished();
      } else {
        this.console.errorStr(`mpg123 exited with code ${code}`);
        onPlayFailed(new Error(`mpg123 exited with code ${code}`));
      }
    });
  }

  private playRawAudio(
    dataBuffer: Buffer,
    resolve: () => void,
    reject: (error: Error) => void
  ) {
    this.spawnProcess(resolve, reject);
    this.process.stdin.write(dataBuffer);
    this.process.stdin.end();
  }

  public play(bytes: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioData = Buffer.from(bytes);
      this.playRawAudio(audioData, resolve, reject);
    });
  }

  public playUrl(url: string): Promise<void> {
    this.stop();

    return new Promise((resolve, reject) => {
      this.spawnProcess(resolve, reject, [url]);
    });
  }

  public togglePause() {
    if (this.process) {
      // Implement toggle pause logic if supported by mpg123
    }
  }

  public stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  cleanup() {
    this.stop();
  }
}
