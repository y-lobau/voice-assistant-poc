import chalk from "chalk";
import ora from "ora";

import { IOutput } from "../../core/interfaces/IOutput";
import { Messages } from "../../Messages";
import { IConsole } from "../../core/interfaces/IConsole";

export class ConsoleOutput implements IOutput, IConsole {
  debug(message: string, obj?: any | undefined): void {
    if (obj) console.debug(message, obj);
    else console.debug(message);
  }
  spinner = ora("Апрацоўка запыту...\n");

  info(message: string, obj?: any): void {
    if (obj) console.log(message, obj);
    else console.log(message);
  }

  async output(message: string): Promise<void> {
    return new Promise((resolve) => {
      console.log(chalk.green(message));
      resolve();
    });
  }

  public async error(ex: Error, obj?: any): Promise<void> {
    if (obj) {
      this.errorStr(ex.stack || ex.message || ex.toString(), obj);
      this.errorStr(chalk.red(Messages.UNEXPECTED_ERROR), obj);
    } else {
      this.errorStr(ex.stack || ex.message || ex.toString());
      this.errorStr(chalk.red(Messages.UNEXPECTED_ERROR));
    }
  }

  public errorStr(message: string, obj?: any): void {
    if (obj) console.log(chalk.red(message), obj);
    else console.log(chalk.red(message));
  }

  public setLoading(text: string): void {
    this.spinner.start(text);
  }

  public stopLoading(): void {
    this.spinner.stop();
  }
}
