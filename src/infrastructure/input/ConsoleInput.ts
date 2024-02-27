import readline, { ReadLine } from "readline";

import { IInput } from "../../core/interfaces/IInput.js";

export class ConsoleInput implements IInput {
  private rl: ReadLine;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    process.stdin.setEncoding("utf8");
  }

  input(): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question("", (answer: string) => {
        resolve(answer);
      });
    });
  }
}
