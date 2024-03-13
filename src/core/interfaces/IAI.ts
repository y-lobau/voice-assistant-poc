import { AIResponse } from "../models/AIResponse.js";
import { SkillFunction } from "../models/SkillFunction.js";

export interface IAI {
  voiceToText(filePath: string): Promise<string>;
  textToVoice(text: string): Promise<string>;
  textToVoiceBytes(text: string): Promise<Buffer>;
  sendText(
    text: string,
    systemMessages: {}[],
    functions: SkillFunction[]
  ): Promise<AIResponse>;
}
