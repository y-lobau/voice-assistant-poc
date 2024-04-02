import { IConsole } from "./interfaces/IConsole.js";
import { IDialogHandler } from "./interfaces/IDialogHandler.js";
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
    private dialog: IDialogHandler,
    private skills: SkillBox,
    private console: IConsole,
    private visualFeedback: IVisualFeedback,
    private mode: "infinite" | "single" = "infinite"
  ) {}

  private startConversation(): Promise<void> {
    return this.output.output(this.defaultQuestion).then(() => this.runLoop());
  }

  private runLoop(immediateReplyPossible: boolean = true): Promise<void> {
    return this.input
      .input({ immediateReplyPossible })
      .then((input: string) => {
        this.visualFeedback.thinking();

        const skillsMessages = this.skills.serviceMessages();

        return this.dialog
          .sendMessage(input, {
            systemMessages: skillsMessages,
            functions: this.skills.functionDefinitions,
          })
          .then((response: AIResponse) => this.handleAIResponse(response))
          .then((responseText) => {
            this.visualFeedback.thinking(false);
            let immediateReplyPossible = false;

            if (responseText) {
              immediateReplyPossible = true;
              return this.output
                .output(responseText)
                .then(() => immediateReplyPossible);
            } else {
              return Promise.resolve().then(() => immediateReplyPossible);
            }
          })
          .then((immediateReplyPossible) => {
            if (this.mode === "infinite") {
              return this.runLoop(immediateReplyPossible);
            }
          })
          .catch((e) => {
            this.output.error(e);
            return this.runLoop(true);
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
