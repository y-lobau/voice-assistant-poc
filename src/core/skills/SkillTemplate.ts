import { SkillFunction } from "../models/SkillFunction.js";
import { ISkill } from "../interfaces/ISkill.js";

export class SkillTemplate implements ISkill {
  functions: SkillFunction[];
  onFinished: (skill: ISkill) => void;
  systemPrompt = "";

  constructor() {
    this.functions = [
      new SkillFunction(
        "foo",
        "апісанне функцыі foo",
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
        this.foo
      ),
    ];
  }

  cleanup(): void {}

  public serviceMessages() {
    // const booksSuffix =
    //   "Спіс кніг у JSON:" + JSON.stringify(this.books.map((b) => b.toShort()));
    return [{ role: "system", content: this.systemPrompt }];
  }

  private foo(param: string): void {}
}
