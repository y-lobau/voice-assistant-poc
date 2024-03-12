import { ISkill } from "../interfaces/ISkill.js";
import { Callback } from "../models/Callback.js";
import { SkillFunction } from "../models/SkillFunction.js";

export class SkillBox {
  public functionDefinitions: SkillFunction[];
  private functions: { [key: string]: Function };
  private skills: ISkill[];

  constructor(skills: ISkill[]) {
    this.skills = skills;
    this.functionDefinitions = skills.flatMap((skill) => skill.functions);

    this.functions = {};

    this.skills.forEach((skill) => {
      skill.functions.forEach((func) => {
        this.functions[func.name] = func.func.bind(skill);
      });
    });
  }

  cleanup() {
    this.skills.forEach((skill) => {
      if (skill.cleanup) {
        skill.cleanup();
      }
    });
  }

  public init(): Promise<void> {
    const promises = this.skills
      .filter((skill) => skill.init)
      .map((skill) => skill.init());
    return Promise.all(promises).then(() => {});
  }

  public serviceMessages(): { role: string; content: string }[] {
    return this.skills.flatMap((skill) =>
      skill.serviceMessages ? skill.serviceMessages() : []
    );
  }

  public use(callbacks: Callback[]): Promise<void> {
    const promises = callbacks.map((callback) => {
      const func = this.functions[callback.functionName];
      if (!func) {
        return Promise.reject(`Function ${callback.functionName} not found`);
      }
      return func(...callback.args) as Promise<void>;
    });
    return Promise.all(promises).then(() => {});
  }
}
