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

  private async runLoop(startListening: boolean = false): Promise<void> {
    try {
      const input: string = await this.input.input({
        immediateReplyPossible: startListening,
      });

      if (!input) {
        this.eventBus.trigger("emptyInputDetected");
        return this.runLoop(true);
      }

      this.eventBus.trigger("processingInputStarted");
      const skillsMessages = this.skills.serviceMessages();

      const response: AIResponse = await this.dialog.sendMessage(input, {
        systemMessages: skillsMessages,
        functions: this.skills.functionDefinitions,
      });

      const responseText = await this.handleAIResponse(response);

      this.eventBus.trigger("processingInputFinished");
      let immediateReplyPossible = false;

      if (responseText) {
        immediateReplyPossible = true;
        await this.output.output(responseText);
      }

      if (this.mode === "infinite") {
        return this.runLoop(immediateReplyPossible);
      }
    } catch (error) {
      await this.output.error(error);
      return this.runLoop(true);
    }
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
