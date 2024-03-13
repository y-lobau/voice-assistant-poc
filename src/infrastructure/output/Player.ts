import { spawn } from "child_process";

export class Player {
  private playRawAudio(dataBuffer, resolve, reject) {
    // Spawn aplay as a child process
    const aplay = spawn("aplay", ["-f", "cd"]);

    // Handle error output
    aplay.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    // Write the audio data to aplay's stdin
    aplay.stdin.write(dataBuffer);
    aplay.stdin.end();

    // Listen for when the aplay process finishes
    aplay.on("close", (code) => {
      console.log(`aplay process exited with code ${code}`);
      resolve();
    });
  }

  public play(bytes: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const audioData = Buffer.from(bytes);
      this.playRawAudio(audioData, resolve, reject);
    });
  }
}
