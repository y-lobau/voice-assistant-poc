import OpenAI from "openai";
import {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources";
import * as fs from "fs";
import { AIResponse } from "../../core/models/AIResponse";
import { Callback } from "../../core/models/Callback";
import { IAI } from "../../core/interfaces/IAI";
import { SkillFunction } from "../../core/models/SkillFunction";
import { IConsole } from "../../core/interfaces/IConsole";
import { Assistant } from "openai/resources/beta/assistants/assistants";
import {
  Message,
  TextContentBlock,
} from "openai/resources/beta/threads/messages/messages";
import {
  FunctionToolCall,
  RunStep,
} from "openai/resources/beta/threads/runs/steps";

export class OpenAIService implements IAI {
  openai = new OpenAI();
  defaultSystemMessage =
    "Ты-галасавы асісіэнт.Ты адказваеш толькі на беларускай мове.Усе лічбы і нумерацыю у адказах пішы словамі.Калі не разумееш,што ад цябе хочуць-адказвай:'прабацце,я не зусім вас зразумеў.'";

  constructor(private model: string, private console: IConsole) {}

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

  public getAssistant(id: string): Promise<Assistant> {
    return this.openai.beta.assistants.retrieve(id);
  }

  public sendCompletions(
    messages: any[],
    functions: SkillFunction[]
  ): Promise<AIResponse> {
    const allMessages = messages.concat({
      role: "system",
      content: this.defaultSystemMessage,
    });

    this.console.debug(
      `Sending messages to model ${this.model}: ${JSON.stringify(messages)}`
    );

    return this.openai.chat.completions
      .create({
        messages: messages as ChatCompletionMessageParam[],
        model: this.model,
        tools: functions.map(
          this.skillFunctionToDefinition
        ) as Array<ChatCompletionTool>,
      })
      .then((completion) => this.handleCompletion(completion));
  }

  public createThreadMessage(threadId: string, text: string): Promise<void> {
    return this.openai.beta.threads.messages
      .create(threadId, {
        role: "user",
        content: text,
      })
      .then(() => {});
  }

  public createThread(): Promise<string> {
    return this.openai.beta.threads.create().then((thread) => thread.id);
  }

  public runAssistant(
    assistantId: string,
    threadId: string
  ): Promise<AIResponse> {
    return new Promise((resolve, reject) => {
      this.openai.beta.threads.runs
        .createAndStream(
          threadId,
          {
            assistant_id: assistantId,
          },
          { stream: true }
        )
        // .on("event", (event) => {
        //   this.console.debug(`Event: ${JSON.stringify(event, null, 2)}`);
        // })
        .on("messageDone", (message: Message) => {
          if (message.content[0].type === "text") {
            const textBlock = message.content[0] as TextContentBlock;
            resolve(new AIResponse(textBlock.text.value, []));
          }
        })
        .on("runStepDone", (runStep: RunStep, snapshot: RunStep) => {
          this.console.debug(
            `Run step done: ${JSON.stringify(runStep, null, 2)}`
          );
        })
        .on("toolCallDone", (toolCall: FunctionToolCall) => {
          const callback = new Callback(
            toolCall.function.name,
            this.parseFunctionArgs(toolCall.function.arguments)
          );
          resolve(new AIResponse("", [callback]));
        });
    });
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
    return args ? Object.values(JSON.parse(args)) : [];
  }
}
