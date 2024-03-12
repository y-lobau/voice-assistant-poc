import { IInput } from "../../core/interfaces/IInput.js";
import OpenAI from "openai";
import { IConsole } from "../../core/interfaces/IConsole.js";
import * as fs from "fs";
import { AudioWorker } from "./audio/picovoice/AudioWorker.js";
import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback.js";

export class VoiceInput implements IInput {
  private worker: AudioWorker;

  constructor(
    private openai: OpenAI,
    private console: IConsole,
    private visualFeedback: IVisualFeedback,
    private picoApiKey: string
  ) {}

  input(): Promise<string> {
    return new Promise((resolve, reject) => {
      return this.recordMic(resolve, reject);
    }).then((filePath: string) => {
      return this.voiceToText(filePath);
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

  private voiceToText(filePath: string): Promise<string> {
    const transcription = this.openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language: "be",
    });
    return transcription.then((res) => {
      this.console.info("Transcription: " + res.text);
      return res.text;
    });
  }

  public cleanup() {
    if (this.worker) this.worker.cleanup(); // Ensure this method exists and is public in AudioWorker
  }
}
