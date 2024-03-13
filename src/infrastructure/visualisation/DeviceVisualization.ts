import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback";
import { ConsoleOutput } from "../output/ConsoleOutput";
import { Gpio } from "onoff";

export class DeviceVisualization implements IVisualFeedback {
  LED = new Gpio(4, "out");
  constructor(private console: ConsoleOutput) {}

  initializing(start: boolean = true) {
    this.console.info("initializing...");
    this.fireLed(start);
  }
  listening(start: boolean = true) {
    this.console.info("listening...");
    this.fireLed(start);
  }
  talking(start: boolean = true) {
    this.console.info("talking...");
    this.fireLed(start);
  }
  thinking(start: boolean = true) {
    this.console.info("thinking...");
    this.fireLed(start);
  }
  waiting(start: boolean = true) {
    this.console.info("waiting...");
    this.fireLed(start);
  }

  fireLed(on: boolean) {
    this.LED.writeSync(on ? 1 : 0);
  }
}
