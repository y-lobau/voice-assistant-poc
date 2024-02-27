import chalk from "chalk";
import ora from "ora";

import { IOutput } from "../../core/interfaces/IOutput.js";
import { Messages } from "../../Messages.js";
import { IConsole } from "../../core/interfaces/IConsole.js";

export class ConsoleOutput implements IOutput, IConsole {
  debug(message: string): void {
    console.debug(message);
  }
  spinner = ora("Апрацоўка запыту...\n");

  info(message: string): void {
    console.log(message);
  }

  async output(message: string): Promise<void> {
    this.stopLoading();
    console.log(chalk.green(message));
  }

  public error(ex: Error): void {
    this.errorStr(ex.stack || ex.message || ex.toString());
    this.errorStr(chalk.red(Messages.UNEXPECTED_ERROR));
  }

  public errorStr(message: string): void {
    this.stopLoading();
    console.log(chalk.red(message));
  }

  public setLoading(): void {
    // this.spinner.start();
  }

  public stopLoading(): void {
    // this.spinner.stop();
  }
}
