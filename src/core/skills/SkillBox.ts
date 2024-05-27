import { Omnibus } from "@hypersphere/omnibus";
import { ISkill } from "../interfaces/ISkill.js";
import { Callback } from "../models/Callback.js";
import { SkillFunction } from "../models/SkillFunction.js";
import { Events } from "../interfaces/Events.js";

export class SkillBox {
  public functionDefinitions: SkillFunction[];
  private functions: Record<string, [Function, ISkill]> = {};
  private activeSkills: ISkill[] = [];

  constructor(private skills: ISkill[], eventBus: Omnibus<Events>) {
    this.functionDefinitions = skills.flatMap((skill) => skill.functions);

    eventBus.on("voiceInputStarted", () => this.onVoiceInputStarted());
    eventBus.on("voiceInputFinished", () => this.onVoiceInputFinished());
    eventBus.on("buttonPressed", () => this.onButtonPressed());

    this.skills.forEach((skill) => {
      skill.functions.forEach((func) => {
        this.functions[func.name] = [func.func.bind(skill), skill];
      });

      skill.onFinished = (skill) => this.onSkillFinished(skill);
    });
  }

  private onButtonPressed() {
    this.activeSkills.forEach((skill) => {
      if (skill.pauseOrStop) skill.pauseOrStop();
    });
  }

  private onVoiceInputFinished(): void | Promise<void> {
    if (this.activeSkills.length > 0) {
      this.activeSkills.forEach((skill) => {
        if (skill.continue) {
          skill.continue();
        }
      });
    }
  }

  private onVoiceInputStarted(): void | Promise<void> {
    if (this.activeSkills.length > 0) {
      this.activeSkills.forEach((skill) => {
        if (skill.onVoiceInterrupted) {
          skill.onVoiceInterrupted();
        }
      });
    }
  }

  private onSkillFinished(skill: ISkill) {
    this.activeSkills = this.activeSkills.filter(
      (activeSkill) => activeSkill !== skill
    );
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
      const [func, skill] = this.functions[callback.functionName];
      if (!func) {
        return Promise.reject(`Function ${callback.functionName} not found`);
      }
      this.activeSkills.push(skill);
      return func(...callback.args) as Promise<void>;
    });
    return Promise.all(promises).then(() => {});
  }
}
