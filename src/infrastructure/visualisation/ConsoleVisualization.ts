import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback";
import { ConsoleOutput } from "../output/ConsoleOutput";

export class ConsoleVisualization implements IVisualFeedback {
  constructor(private console: ConsoleOutput) {}

  initializing(start: boolean = true) {
    this.setLoading(start, "Запускаюсь...\n");
  }
  listening(start: boolean = true) {
    this.setLoading(start, "Слухаю...\n");
  }
  talking(start: boolean = true) {
    this.setLoading(start, "Адказваю...\n");
  }
  thinking(start: boolean = true) {
    this.setLoading(start, "Думаю...\n");
  }
  waiting(start: boolean = true) {
    this.setLoading(start, "Чакаю...\n");
  }

  setLoading(start: boolean, text: string) {
    if (start) {
      this.console.setLoading(text);
    } else {
      this.console.stopLoading();
    }
  }
}
