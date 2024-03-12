import OpenAI from "openai";
import {
  ChatCompletion,
  ChatCompletionMessage,
  ChatCompletionTool,
} from "openai/resources";
import { SkillBox } from "../core/skills/SkillBox.js";
import { AIResponse } from "../core/models/AIResponse.js";
import { Callback } from "../core/models/Callback.js";
import { IAI } from "../core/interfaces/IAI.js";
import { SkillFunction } from "../core/models/SkillFunction.js";
import { IConsole } from "../core/interfaces/IConsole.js";

export class OpenAIService implements IAI {
  openai = new OpenAI();
  defaultSystemMessage =
    "Ты адказваеш толькі на беларускай мове.Калі адказ змяшчае толькі лічбы-адказвай словамі";

  constructor(
    private model: string,
    public skills: SkillBox,
    private console: IConsole
  ) {
    this.skills = skills;
    this.model = model;
  }

  public sendText(text: string): Promise<AIResponse> {
    const skillsMessages = this.skills.serviceMessages();

    const messages = skillsMessages
      .concat({
        role: "system",
        content: this.defaultSystemMessage,
      })
      .concat({ role: "user", content: text });

    this.console.debug(
      `Sending messages to model ${this.model}: ${JSON.stringify(messages)}`
    );

    return this.openai.chat.completions
      .create({
        messages: messages as ChatCompletionMessage[],
        model: this.model,
        tools: this.functionDefinitions as Array<ChatCompletionTool>,
      })
      .then((completion) => this.handleCompletion(completion));
  }

  private get functionDefinitions(): ChatCompletionTool[] {
    return this.skills.functionDefinitions.map(this.skillFunctionToDefinition);
  }

  private skillFunctionToDefinition(func: SkillFunction): ChatCompletionTool {
    return {
      type: "function",
      function: {
        name: func.name,
        description: func.description,
        parameters: func.parameters,
      },
    };
  }

  private handleCompletion(completion: ChatCompletion): AIResponse {
    const callbacks =
      completion.choices[0].message.tool_calls?.map(
        (f) =>
          new Callback(
            f.function.name,
            this.parseFunctionArgs(f.function.arguments)
          )
      ) || [];
    return new AIResponse(completion.choices[0].message.content, callbacks);
  }

  private parseFunctionArgs(args: string): any[] {
    return Object.values(JSON.parse(args));
  }
}
