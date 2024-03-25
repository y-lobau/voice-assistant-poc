import { IConsole } from "../../core/interfaces/IConsole";
import { IDialogHandler } from "../../core/interfaces/IDialogHandler";
import { AIResponse } from "../../core/models/AIResponse";
import { OpenAIService } from "./OpenAIService";

export class AssistantDialog implements IDialogHandler {
  constructor(private console: IConsole, private aiService: OpenAIService) {}
  assistantId = "asst_sJhBpiUdPH8zRrRenEeQBsoX";
  threadId: string | null = null;
  threadStartTime: Date | null = null;
  threadLifetimeMs = 60 * 1000; // 1 minute

  sendMessage(text: string, additionalContext: {}): Promise<AIResponse> {
    return this.lastThreadId().then((threadId: string) => {
      return this.aiService.createThreadMessage(threadId, text).then(() => {
        return this.aiService.runAssistant(this.assistantId, threadId);
      });
    });
  }

  lastThreadId(): Promise<string> {
    if (!this.threadId || this.threadExpired()) {
      return this.aiService.createThread().then((threadId: string) => {
        this.threadId = threadId;
        return threadId;
      });
    } else return Promise.resolve(this.threadId);
  }

  threadExpired(): boolean {
    if (this.threadStartTime) {
      return (
        new Date().getTime() - this.threadStartTime.getTime() >
        this.threadLifetimeMs
      );
    } else return true;
  }
}
