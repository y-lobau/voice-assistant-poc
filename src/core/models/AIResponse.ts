import { Callback } from "./Callback.js";

export class AIResponse {
  content: string;
  callbacks: Callback[];

  constructor(content: string, callbacks: Callback[]) {
    this.content = content;
    this.callbacks = callbacks;
  }
}
