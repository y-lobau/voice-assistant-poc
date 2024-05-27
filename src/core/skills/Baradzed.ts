import { SkillFunction } from "../models/SkillFunction.js";
import { ISkill } from "../interfaces/ISkill.js";
import { AudioPlayer } from "../../infrastructure/output/AudioPlayer.js";
import fs from "fs/promises";
import path from "path";

const assetsPath = path.join(process.cwd(), "dist", "assets", "barada.mp3");

export class BaradzedSkill implements ISkill {
  functions: SkillFunction[];
  onFinished: (skill: ISkill) => void;
  systemPrompt = "";

  constructor(private player: AudioPlayer) {
    this.functions = [
      new SkillFunction(
        "playBaradzed",
        "Запускай гэту функцыю для праігравання Дзеда Барадзеда",
        {
          type: "object",
          properties: {
            param: {
              type: "string",
              description: "",
            },
          },
          required: ["param"],
        },
        this.baradzed
      ),
    ];
  }

  cleanup(): void {}

  public serviceMessages() {
    return [];
  }

  private async baradzed(param: string): Promise<void> {
    const data = await fs.readFile(assetsPath);
    this.player.play(data);
  }

  public pauseOrStop(): void {
    console.log("BaradzedSkill: pauseOrStop()");
    this.player.stop();
  }
}
