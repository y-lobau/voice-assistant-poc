import OpenAI from "openai";
import {
  ChatCompletion,
  ChatCompletionMessage,
  ChatCompletionTool,
} from "openai/resources";
import * as fs from "fs";
import { AIResponse } from "../core/models/AIResponse.js";
import { Callback } from "../core/models/Callback.js";
import { IAI } from "../core/interfaces/IAI.js";
import { SkillFunction } from "../core/models/SkillFunction.js";
import { IConsole } from "../core/interfaces/IConsole.js";

export class OpenAIService implements IAI {
  openai = new OpenAI();
  defaultSystemMessage =
    "Ты адказваеш толькі на беларускай мове.Калі адказ змяшчае толькі лічбы-адказвай словамі";

  constructor(private model: string, private console: IConsole) {
    this.model = model;
  }

  textToVoice(text: string): Promise<Buffer> {
    return this.openai.audio.speech
      .create({
        model: "tts-1",
        voice: "echo",
        input: text,
      })
      .then((mp3) => {
        return mp3.arrayBuffer().then((array) => Buffer.from(array));
      });
  }

  public voiceToText(filePath: string): Promise<string> {
    const transcription = this.openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language: "be",
    });
    return transcription.then((res) => {
      this.console.info("Transcription: " + res.text);
      return res.text;
    });
  }

  public sendText(
    text: string,
    systemMessages: {}[],
    functions: SkillFunction[]
  ): Promise<AIResponse> {
    const messages = systemMessages
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
        tools: functions.map(
          this.skillFunctionToDefinition
        ) as Array<ChatCompletionTool>,
      })
      .then((completion) => this.handleCompletion(completion));
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
