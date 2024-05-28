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
        "Ёсць такі казачны герой - Дзед Барадзед.Пра яго ёсць песня. Запускай гэту функцыю толькі калі цябе просяць прайграць/паставіць песню Дзеда Барадзеда.Ніколі сам не прапаноўвай запусціць песню.",
        {
          type: "object",
          properties: {},
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
