import Play from "play-sound";
import { spawn } from "child_process";
import { IConsole } from "../../core/interfaces/IConsole";

export class AudioPlayer {
  constructor(private console: IConsole) {}

  playerProcess: Play.ChildProcess | null = null;
  player = Play({ player: "mpg123" });

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

  public playUrl(url: string): Promise<void> {
    this.stop();

    return new Promise((resolve, reject) => {
      // Assuming you have configured `play-sound` opts to use mpg123 or another player
      this.playerProcess = this.player.play(url, {}, (err: Error | null) => {
        if (err) {
          console.error("Failed to play the MP3 file:", err);
          reject(err);
        } else {
          console.debug("MP3 playback started successfully.");
        }
      });
      resolve();
    });
  }

  public stop() {
    if (this.playerProcess) {
      this.playerProcess.kill();
    }
  }
}
