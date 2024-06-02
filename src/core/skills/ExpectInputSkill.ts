import { SkillFunction } from "../models/SkillFunction.js";
import { ISkill } from "../interfaces/ISkill.js";

export class ExpectInputSkill implements ISkill {
  functions: SkillFunction[];
  onFinished: (skill: ISkill) => void;
  systemPrompt = "";

  constructor() {
    this.functions = [
      new SkillFunction(
        "expectInput",
        "выклікай функцыю,калі хочаш удакладніць мой запыт",
        {
          type: "object",
          properties: {
            question: {
              type: "string",
              description: "тваё пытанне ці ўдакладненне",
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
