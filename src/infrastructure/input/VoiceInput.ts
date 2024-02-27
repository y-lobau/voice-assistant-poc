import readline from "readline";
import { IInput } from "../../core/interfaces/IInput.js";
import { AudioWorker } from "./AudioWorker.js";
import OpenAI from "openai";
import { IConsole } from "../../core/interfaces/IConsole.js";

export class VoiceInput implements IInput {
  private rl;
  private outputFile = "./output.mp3";
  private worker: AudioWorker;

  constructor(private openai: OpenAI, private console: IConsole) {
    this.setupReadline();
  }

  private setupReadline() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  input(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.worker = new AudioWorker(this.console);

      // Listen for 'q' to stop recording
      this.rl.on("line", (input) => {
        if (input.trim().toLowerCase() === "q") {
          this.worker.stop(); // Ensure this method exists and is public in AudioWorker
          this.rl.close(); // Consider resetting the readline interface for future inputs
          resolve(this.outputFile); // Resolve with the file path
        }
      });

      this.worker
        .recordMic()
        .then((filePath) => {
          this.console.info("File recorded: " + filePath);
          resolve(filePath); // Resolve the promise with the path of the recorded file
        })
        .catch((err) => {
          this.console.error(err);
          reject(err); // Reject the promise if there's an error
        });

      this.console.info(
        'Listening for speech. Press "q" then "Enter" to stop.'
      );
    });
  }

  public cleanup() {
    this.worker.cleanup(); // Ensure this method exists and is public in AudioWorker
  }
}
