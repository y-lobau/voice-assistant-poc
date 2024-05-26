import { IConsole } from "../../core/interfaces/IConsole";
import { IDialogHandler } from "../../core/interfaces/IDialogHandler";
import { OpenAIService } from "./OpenAIService";
import { SkillFunction } from "../../core/models/SkillFunction";
import { AIResponse } from "../../core/models/AIResponse";

export class SimpleMessageDialog implements IDialogHandler {
  constructor(
    private model: string,
    private openAIService: OpenAIService,
    private console: IConsole
  ) {}

  defaultSystemMessage =
    "Ты-галасавы асісіэнт.Ты адказваеш толькі на беларускай мове.Усе лічбы і нумерацыю у адказах пішы словамі";

  sendMessage(text, additionalContext): Promise<AIResponse> {
    const messages = additionalContext.systemMessages
      .concat({
        role: "system",
        content: this.defaultSystemMessage,
      })
      .concat({ role: "user", content: text });

    this.console.debug(
      `Sending messages to model ${this.model}: ${JSON.stringify(messages)}`
    );

    return this.openAIService.sendCompletions(
      messages,
      additionalContext.functions as SkillFunction[]
    );
  }
}
