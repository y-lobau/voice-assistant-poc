import { SkillFunction } from "../models/SkillFunction.js";

export interface ISkill {
  onFinished: (skill: ISkill) => void;
  cleanup?(): void;
  functions: SkillFunction[];
  serviceMessages?(): { role: string; content: string }[];
  init?(): Promise<void>;
  onVoiceInterrupted?(): void | Promise<void>;
  continue?(): void | Promise<void>;
}
