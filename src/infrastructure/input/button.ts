import { Omnibus } from "@hypersphere/omnibus";
import { Gpio } from "pigpio"; // Changed from 'onoff' to 'pigpio' for PWM support
import { Events } from "../../core/interfaces/Events";

export class ButtonHandler {
  public static init(eventEmitter: Omnibus<Events>) {
    const button = new Gpio(17, {
      mode: Gpio.INPUT,
      pullUpDown: Gpio.PUD_DOWN,
      edge: Gpio.RISING_EDGE,
    });

    button.on("interrupt", (level) => {
      if (level === 1) {
        eventEmitter.trigger("buttonPressed");
      }
    });
  }
}
