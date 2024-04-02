import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { IConsole } from "../../core/interfaces/IConsole";

export class AudioPlayer {
  constructor(private console: IConsole) {}
  process: ChildProcessWithoutNullStreams;

  private spawnProcess(onPlayFinished, onPlayFailed, args: string[] = ["-"]) {
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

  private playRawAudio(dataBuffer, resolve, reject) {
    this.spawnProcess(resolve, reject);
    this.process.stdin.write(dataBuffer);
    this.process.stdin.end();
  }

  public play(bytes: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const audioData = Buffer.from(bytes);
      this.playRawAudio(audioData, resolve, reject);
    });
  }

  public playUrl(
    url: string,
    onFinished: () => void = () => {}
  ): Promise<void> {
    this.stop();

    return new Promise((resolve, reject) => {
      this.spawnProcess(onFinished, reject, [url]);
      resolve();
    });
  }

  public togglePause() {
    if (this.process) {
      // TBD
    }
  }

  public stop() {
    if (this.process) {
      this.process.kill();
    }
  }

  cleanup() {
    this.stop();
  }
}
