import chalk from "chalk";
import ora from "ora";

import { IOutput } from "../../core/interfaces/IOutput.js";
import { Messages } from "../../Messages.js";
import { IConsole } from "../../core/interfaces/IConsole.js";
import { Logger } from "winston";

export class ConsoleOutput implements IOutput, IConsole {
  constructor(private errorLogger: Logger) {}

  debug(message: string): void {
    console.debug(message);
  }
  spinner = ora("Апрацоўка запыту...\n");

  info(message: string): void {
    console.log(message);
  }

  async output(message: string): Promise<void> {
    return new Promise((resolve) => {
      console.log(chalk.green(message));
      resolve();
    });
  }

  public async error(ex: Error): Promise<void> {
    this.errorStr(ex.stack || ex.message || ex.toString());
    this.errorStr(chalk.red(Messages.UNEXPECTED_ERROR));
    this.errorLogger.error(ex);
  }

  public errorStr(message: string): void {
    console.log(chalk.red(message));
    this.errorLogger.error(message);
  }

  public setLoading(text: string): void {
    this.spinner.start(text);
  }

  public stopLoading(): void {
    this.spinner.stop();
  }
}
