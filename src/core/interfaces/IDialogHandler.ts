import { AIResponse } from "../models/AIResponse.js";

export interface IDialogHandler {
  sendMessage(text: string, additionalContext: {}): Promise<AIResponse>;
}
