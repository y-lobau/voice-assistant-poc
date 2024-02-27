import OpenAI from "openai";
import * as path from "path";
import * as fs from "fs";
import Play from "play-sound";
import { IOutput } from "../../core/interfaces/IOutput.js";
import { Messages } from "../../Messages.js";
import { IConsole } from "../../core/interfaces/IConsole.js";

export default class VoiceOutput implements IOutput {
  speechFile: string = path.resolve("./speech.mp3");
  player = Play({ player: "mpg123" });

  constructor(private openai: OpenAI, private console: IConsole) {}
  error(ex) {
    this.console.error(ex);
    this.textToVoice(Messages.UNEXPECTED_ERROR);
  }

  output(message: string): Promise<void> {
    // You may need to adjust the method for generating audio from text
    return this.textToVoice(message);
  }

  private async textToVoice(text: string) {
    const mp3 = await this.openai.audio.speech.create({
      model: "tts-1",
      voice: "echo",
      input: text,
    });

    const buffer: Buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(this.speechFile, buffer);

    // Play the audio file through the speakers
    this.player.play(this.speechFile, (err: Error | null) => {
      if (err) {
        console.error("Failed to play the file:", err);
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
      }
    });
  }
}
