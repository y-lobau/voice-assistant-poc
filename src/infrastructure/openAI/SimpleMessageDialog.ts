import { IDialogHandler } from "../../core/interfaces/IDialogHandler";
import { OpenAIService } from "./OpenAIService";
import { SkillFunction } from "../../core/models/SkillFunction";
import { AIResponse } from "../../core/models/AIResponse";

export class SimpleMessageDialog implements IDialogHandler {
  constructor(private openAIService: OpenAIService) {}

  sendMessage(text, additionalContext): Promise<AIResponse> {
    const messages = additionalContext.systemMessages.concat({
      role: "user",
      content: text,
    });
    return this.openAIService.sendCompletions(
      messages,
      additionalContext.functions as SkillFunction[]
    );
  }
}
