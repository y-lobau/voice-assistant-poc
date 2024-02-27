import { AIResponse } from "../models/AIResponse.js";
import { SkillBox } from "../skills/SkillBox.js";

export interface IAI {
  skills: SkillBox;
  sendText(text: string): Promise<AIResponse>;
}
