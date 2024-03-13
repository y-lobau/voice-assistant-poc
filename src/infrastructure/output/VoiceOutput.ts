import { IOutput } from "../../core/interfaces/IOutput.js";
import { Messages } from "../../Messages.js";
import { IConsole } from "../../core/interfaces/IConsole.js";
import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback.js";
import { IAI } from "../../core/interfaces/IAI.js";
import { AudioPlayer } from "./AudioPlayer.js";

export default class VoiceOutput implements IOutput {
  constructor(
    private ai: IAI,
    private console: IConsole,
    private visualFeedback: IVisualFeedback,
    private audioPlayer: AudioPlayer
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

    return this.ai.textToVoice(text).then((buffer: Buffer) => {
      this.visualFeedback.thinking(false);
      this.visualFeedback.talking();

      return this.audioPlayer
        .play(buffer)
        .then(() => this.visualFeedback.talking(false))
        .catch(reject)
        .then(resolve);
    });
  }
}
