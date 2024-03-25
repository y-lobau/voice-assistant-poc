import { IInput } from "../../core/interfaces/IInput.js";
import { IConsole } from "../../core/interfaces/IConsole.js";
import { AudioWorker } from "./audio/picovoice/AudioWorker.js";
import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback.js";
import { IAI } from "../../core/interfaces/IAI.js";
import { Omnibus } from "@hypersphere/omnibus";
import { Events } from "../../core/interfaces/Events.js";

export class VoiceInput implements IInput {
  private worker: AudioWorker;

  constructor(
    private ai: IAI,
    private console: IConsole,
    private visualFeedback: IVisualFeedback,
    private picoApiKey: string,
    private eventBus: Omnibus<Events>
  ) {}

  input(): Promise<string> {
    return new Promise((resolve, reject) => {
      return this.recordMic(resolve, reject);
    }).then((filePath: string) => {
      return this.ai.voiceToText(filePath);
    });
  }

  private recordMic(resolve, reject): Promise<string | null> {
    this.worker = new AudioWorker(
      this.console,
      this.visualFeedback,
      this.picoApiKey
    );

    return this.worker
      .recordInput()
      .then((filePath: string) => {
        this.console.debug("File recorded: " + filePath);
        return resolve(filePath);
      })
      .catch((err) => {
        this.console.error(err);
        return reject(err);
      });
  }

  public cleanup() {
    if (this.worker) this.worker.cleanup(); // Ensure this method exists and is public in AudioWorker
  }
}
