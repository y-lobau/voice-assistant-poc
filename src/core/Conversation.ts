import { IAI } from "./interfaces/IAI.js";
import { IConsole } from "./interfaces/IConsole.js";
import { IInput } from "./interfaces/IInput.js";
import { IOutput } from "./interfaces/IOutput.js";
import { IVisualFeedback } from "./interfaces/IVisualFeedback.js";
import { AIResponse } from "./models/AIResponse.js";
import { SkillBox } from "./skills/SkillBox.js";

export class Conversation {
  private defaultQuestion = "Чым я магу вам дапамагчы?";

  constructor(
    private input: IInput,
    private output: IOutput,
    private ai: IAI,
    private skills: SkillBox,
    private console: IConsole,
    private visualFeedback: IVisualFeedback,
    private mode: "infinite" | "single" = "infinite"
  ) {}

  private startConversation(): Promise<void> {
    return this.output.output(this.defaultQuestion).then(() => this.runLoop());
  }

  private runLoop(): Promise<void> {
    return this.input.input().then((input: string) => {
      this.visualFeedback.thinking();

      return this.ai
        .sendText(input)
        .then((response: AIResponse) => this.handleAIResponse(response))
        .then((responseText) => {
          this.visualFeedback.thinking(false);
          if (responseText) {
            return this.output.output(responseText);
          } else {
            return Promise.resolve();
          }
        })
        .then(() => {
          if (this.mode === "infinite") {
            return this.runLoop();
          }
        })
        .catch((e) => {
          this.output.error(e);
          return this.runLoop();
        });
    });
  }

  private handleAIResponse(response: AIResponse): Promise<string | null> {
    this.console.info(`AI response: ${JSON.stringify(response)}`);
    return this.skills.use(response.callbacks).then(() => response.content);
  }

  public async start(): Promise<void> {
    return this.skills.init().then(() => {
      return this.startConversation();
    });
  }
}
