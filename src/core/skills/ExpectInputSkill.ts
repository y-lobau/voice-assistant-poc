import { SkillFunction } from "../models/SkillFunction.js";
import { ISkill } from "../interfaces/ISkill.js";

export class ExpectInputSkill implements ISkill {
  functions: SkillFunction[];
  onFinished: (skill: ISkill) => void;
  systemPrompt =
    "Выклікай функцыю expectInput() калі чакаеш нейкі адказ ад карыстальніка, калі твой адказ сканчваецца '?'";

  constructor() {
    this.functions = [
      new SkillFunction(
        "expectInput",
        "перадавай у функцыю твой запыт",
        {
          type: "object",
          properties: {
            question: {
              type: "string",
              description: "твой запыт",
            },
          },
          required: ["question"],
        },
        this.expectInput
      ),
    ];
  }

  cleanup(): void {}

  public serviceMessages() {
    // const booksSuffix =
    //   "Спіс кніг у JSON:" + JSON.stringify(this.books.map((b) => b.toShort()));
    return [{ role: "system", content: this.systemPrompt }];
  }

  private expectInput(question: string): void {
    console.log("Expecting input for question:", question);
  }
}
