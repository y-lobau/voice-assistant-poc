import OpenAI from "openai";
import * as path from "path";
import * as fs from "fs";
import Play from "play-sound";
import { IOutput } from "../../core/interfaces/IOutput.js";
import { Messages } from "../../Messages.js";
import { IConsole } from "../../core/interfaces/IConsole.js";
import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback.js";

export default class VoiceOutput implements IOutput {
  speechFile: string = path.resolve("./speech.mp3");
  player = Play({ player: "mpg123" });

  constructor(
    private openai: OpenAI,
    private console: IConsole,
    private visualFeedback: IVisualFeedback
  ) {}

  error(ex): Promise<void> {
    this.console.error(ex);
    return new Promise((resolve, reject) => {
      return this.textToVoice(Messages.UNEXPECTED_ERROR, resolve, reject);
    });
  }

  output(message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      return this.textToVoice(message, resolve, reject);
    });
  }

  private async textToVoice(text: string, resolve, reject) {
    this.visualFeedback.thinking();
    const mp3 = await this.openai.audio.speech.create({
      model: "tts-1",
      voice: "echo",
      input: text,
    });
    this.visualFeedback.thinking(false);

    this.visualFeedback.talking();
    const buffer: Buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(this.speechFile, buffer);

    // Play the audio file through the speakers
    this.player.play(this.speechFile, (err: Error | null) => {
      if (err) {
        console.error("Failed to play the file:", err);
        reject(err);
      } else {
        // No error, file played successfully, now delete the file
        fs.unlink(
          this.speechFile,
          (unlinkErr: NodeJS.ErrnoException | null) => {
            if (unlinkErr) {
              console.error("Failed to delete the file:", unlinkErr);
            } else {
              console.debug("File deleted successfully.");
            }
          }
        );
        this.visualFeedback.talking(false);
        resolve();
      }
    });
  }
}
