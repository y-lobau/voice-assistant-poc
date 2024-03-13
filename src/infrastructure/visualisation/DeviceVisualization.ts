import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback";
import { ConsoleOutput } from "../output/ConsoleOutput";
import { Gpio } from "onoff";

export class DeviceVisualization implements IVisualFeedback {
  LED = new Gpio(4, "out");
  constructor(private console: ConsoleOutput) {}

  initializing(start: boolean = true) {}
  listening(start: boolean = true) {
    if (start) {
      this.LED.writeSync(1);
    } else {
      this.LED.writeSync(0);
    }
  }
  talking(start: boolean = true) {}
  thinking(start: boolean = true) {}
  waiting(start: boolean = true) {}
}
