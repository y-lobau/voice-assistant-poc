import { IOutput } from "../../core/interfaces/IOutput.js";
import { Messages } from "../../Messages.js";
import { IConsole } from "../../core/interfaces/IConsole.js";
import { IAI } from "../../core/interfaces/IAI.js";
import { AudioPlayer } from "./AudioPlayer.js";
import { Omnibus } from "@hypersphere/omnibus";
import { Events } from "../../core/interfaces/Events.js";

export default class VoiceOutput implements IOutput {
  constructor(
    private ai: IAI,
    private console: IConsole,
    private audioPlayer: AudioPlayer,
    private eventBus: Omnibus<Events>
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
    this.eventBus.trigger("processingInputStarted");

    const audioBuffer = this.ai.textToVoice(text);

    this.eventBus.trigger("processingInputFinished");
    this.eventBus.trigger("talkingStarted");

    resolve();

    // return this.audioPlayer
    //   .play(buffer)
    //   .then(() => this.eventBus.trigger("talkingFinished"))
    //   .catch(reject)
    //   .then(resolve);
  }
}
