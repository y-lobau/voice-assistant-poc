import { SkillFunction } from "../models/SkillFunction.js";

export interface ISkill {
  cleanup?(): void;
  functions: SkillFunction[];
  serviceMessages?(): { role: string; content: string }[];
  init?(): Promise<void>;
}
