import { spawn } from "child_process";
import { IConsole } from "../../core/interfaces/IConsole";

export class Player {
  constructor(private console: IConsole) {}

  private playRawAudio(dataBuffer, resolve, reject) {
    const mpg123 = spawn("mpg123", ["-"]);

    mpg123.stderr.on("data", (data) => {
      this.console.errorStr(`stderr: ${data}`);
    });

    mpg123.stdout.on("data", (data) => {
      this.console.debug(`stdout: ${data}`);
    });

    mpg123.stdin.write(dataBuffer);
    mpg123.stdin.end();

    mpg123.on("close", (code) => {
      if (code === 0) {
        this.console.debug("mpg123 finished playing the audio successfully.");
        resolve();
      } else {
        this.console.errorStr(`mpg123 exited with code ${code}`);
        reject(new Error(`mpg123 exited with code ${code}`));
      }
    });
  }

  public play(bytes: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const audioData = Buffer.from(bytes);
      this.playRawAudio(audioData, resolve, reject);
    });
  }
}
