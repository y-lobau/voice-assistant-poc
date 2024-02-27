import { ConsoleOutput } from "../infrastructure/output/ConsoleOutput.js";
import { IAI } from "./interfaces/IAI.js";
import { IConsole } from "./interfaces/IConsole.js";
import { IInput } from "./interfaces/IInput.js";
import { IOutput } from "./interfaces/IOutput.js";
import { AIResponse } from "./models/AIResponse.js";
import { SkillBox } from "./skills/SkillBox.js";

export class Conversation {
  private input: IInput;
  private output: IOutput;
  private ai: IAI;
  private defaultQuestion = "Чым я магу вам дапамагчы?";
  private skills: SkillBox;
  private console: IConsole;

  constructor(
    input: IInput,
    output: IOutput,
    ai: IAI,
    skills: SkillBox,
    console: IConsole
  ) {
    this.input = input;
    this.output = output;
    this.ai = ai;
    this.skills = skills;
    this.console = console;
  }

  private continueConversation(output: string | null): Promise<void> {
    if (output) {
      this.output.output(output);
    }
    return this.runLoop();
  }

  private runLoop(): Promise<void> {
    return this.input.input().then((input: string) => {
      this.console.setLoading();

      return this.ai
        .sendText(input)
        .then((response: AIResponse) => {
          return this.handleAIResponse(response);
        })
        .catch((e) => {
          this.output.error(e);
          return this.runLoop();
        })
        .finally(this.console.stopLoading);
    });
  }

  private handleAIResponse(response: AIResponse): Promise<void> {
    this.console.info(`AI response: ${JSON.stringify(response)}`);

    return this.skills
      .use(response.callbacks)
      .then(() => this.continueConversation(response.content));
  }

  public async start(): Promise<void> {
    return this.skills.init().then(() => {
      return this.continueConversation(this.defaultQuestion);
    });
  }
}
