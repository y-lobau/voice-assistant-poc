import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback";
import { ConsoleOutput } from "../output/ConsoleOutput";
import { Gpio } from "onoff";

export class DeviceVisualization implements IVisualFeedback {
  LED = new Gpio(4, "out");
  constructor(private console: ConsoleOutput) {}

  initializing(start: boolean = true) {
    this.console.info("initializing...");
  }
  listening(start: boolean = true) {
    this.console.info("listening...");
    if (start) {
      this.LED.writeSync(1);
    } else {
      this.LED.writeSync(0);
    }
  }
  talking(start: boolean = true) {
    this.console.info("talking...");
  }
  thinking(start: boolean = true) {
    this.console.info("thinking...");
  }
  waiting(start: boolean = true) {
    this.console.info("waiting...");
  }
}
