import * as fs from "fs";
import Play from "play-sound";
import { IOutput } from "../../core/interfaces/IOutput.js";
import { Messages } from "../../Messages.js";
import { IConsole } from "../../core/interfaces/IConsole.js";
import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback.js";
import { IAI } from "../../core/interfaces/IAI.js";

export default class VoiceOutput implements IOutput {
  player = Play({ player: "mpg123" });

  constructor(
    private ai: IAI,
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

  private async textToVoice(text: string, resolve, reject): Promise<void> {
    this.visualFeedback.thinking();

    return this.ai.textToVoice(text).then((audioFilePath: string) => {
      this.visualFeedback.thinking(false);
      this.visualFeedback.talking();

      this.playAudio(audioFilePath, resolve, reject).then(() =>
        this.visualFeedback.talking(false)
      );
    });
  }

  private async playAudio(
    audioFilePath: string,
    resolve,
    reject
  ): Promise<void> {
    // Play the audio file through the speakers
    this.console.debug("Playing the file: " + audioFilePath);
    return this.player.play(audioFilePath, (err: Error | null) => {
      if (err) {
        console.error("Failed to play the file:", err);
        reject(err);
      } else {
        // No error, file played successfully, now delete the file
        fs.unlink(audioFilePath, (unlinkErr: NodeJS.ErrnoException | null) => {
          if (unlinkErr) {
            console.error("Failed to delete the file:", unlinkErr);
          } else {
            console.debug("File deleted successfully.");
          }
        });
        this.visualFeedback.talking(false);
        resolve();
      }
    });
  }
}
