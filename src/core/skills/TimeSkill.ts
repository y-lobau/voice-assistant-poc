import { SkillFunction } from "../models/SkillFunction.js";
import { ISkill } from "../interfaces/ISkill.js";
import { IOutput } from "../interfaces/IOutput.js";

export class TimeSkill implements ISkill {
  functions: SkillFunction[];
  date = new Date();

  // Options to control the output of toLocaleDateString
  dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  // Options to control the output of toLocaleTimeString
  timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };

  constructor(private output: IOutput) {
    this.functions = [
      new SkillFunction(
        "announceTime",
        "функцыя абвяшчэння бягучага часу.выклікай на запыт кшталту 'Колькі цяпер часу?'",
        {},
        this.announceTime
      ),
    ];
  }

  cleanup(): void {}

  private announceTime(): Promise<void> {
    return new Promise((resolve) => {
      const date = new Date();

      const dateString = date.toLocaleDateString("be-BY", this.dateOptions);
      const timeString = date.toLocaleTimeString("be-BY", this.timeOptions);

      const announcement = `Сёння ${dateString}, час ${timeString}.`;
      this.output.output(announcement).then(resolve);
    });
  }
}
