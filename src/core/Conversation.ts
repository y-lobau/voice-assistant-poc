import { Omnibus } from "@hypersphere/omnibus";
import { IConsole } from "./interfaces/IConsole.js";
import { IDialogHandler } from "./interfaces/IDialogHandler.js";
import { IInput } from "./interfaces/IInput.js";
import { IOutput } from "./interfaces/IOutput.js";
import { AIResponse } from "./models/AIResponse.js";
import { SkillBox } from "./skills/SkillBox.js";
import { Events } from "./interfaces/Events.js";

export class Conversation {
  constructor(
    private input: IInput,
    private output: IOutput,
    private dialog: IDialogHandler,
    private skills: SkillBox,
    private console: IConsole,
    private eventBus: Omnibus<Events>,
    private mode: "infinite" | "single" = "infinite"
  ) {}

  private runLoop(startListening: boolean = false): Promise<void> {
    return this.input
      .input({ immediateReplyPossible: startListening })
      .then((input: string) => {
        this.eventBus.trigger("processingInputStarted");

        const skillsMessages = this.skills.serviceMessages();

        return this.dialog
          .sendMessage(input, {
            systemMessages: skillsMessages,
            functions: this.skills.functionDefinitions,
          })
          .then((response: AIResponse) => this.handleAIResponse(response))
          .then((responseText) => {
            this.eventBus.trigger("processingInputFinished");
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
    this.console.info(`-------------- AI response --------------`);
    this.console.info(JSON.stringify(response, null, 2));
    this.console.info("-----------------------------------------");

    return this.skills.use(response.callbacks).then(() => response.content);
  }

  public async init(): Promise<void> {
    return this.skills.init();
  }

  public async start(): Promise<void> {
    return this.runLoop();
  }
}
