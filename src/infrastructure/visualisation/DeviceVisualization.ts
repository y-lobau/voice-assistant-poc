import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback";
import { ConsoleOutput } from "../output/ConsoleOutput";
import { Gpio } from "pigpio"; // Changed from 'onoff' to 'pigpio' for PWM support

export class DeviceVisualization implements IVisualFeedback {
  leds = [
    new Gpio(4, { mode: Gpio.OUTPUT }),
    new Gpio(17, { mode: Gpio.OUTPUT }),
    new Gpio(27, { mode: Gpio.OUTPUT }),
    new Gpio(22, { mode: Gpio.OUTPUT }),
  ];
  currentLedIndex = 0;
  fadeStepSize = 20; // How much the duty cycle changes each step
  dutyCycle = 0;
  intervalId = null;

  constructor(private console: ConsoleOutput) {}

  private startFadingSequentially() {
    if (this.intervalId === null) {
      this.intervalId = setInterval(() => {
        // Only update the current LED
        this.leds[this.currentLedIndex].pwmWrite(
          Math.min(Math.max(this.dutyCycle, 0), 255)
        );

        // Adjust the duty cycle for the next iteration
        this.dutyCycle += this.fadeStepSize;

        // Reverse the fade direction at extremes and adjust duty cycle bounds
        if (this.dutyCycle >= 255) {
          this.fadeStepSize = -this.fadeStepSize;
          this.dutyCycle = 255;
        } else if (this.dutyCycle <= 0) {
          this.leds[this.currentLedIndex].pwmWrite(0); // Ensure the current LED is off
          this.currentLedIndex = (this.currentLedIndex + 1) % this.leds.length;
          this.fadeStepSize = Math.abs(this.fadeStepSize);
          this.dutyCycle = 0; // Reset the duty cycle for the next LED
        }
      }, 10); // Adjust interval as needed
    }
  }

  private stopFading() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.leds.forEach((led) => {
        led.pwmWrite(0); // Turn off all LEDs
      });
      this.currentLedIndex = 0; // Reset to the first LED
      this.fadeStepSize = Math.abs(this.fadeStepSize); // Ensure step size is positive
      this.dutyCycle = 0; // Reset the duty cycle
    }
  }

  private toggleLeds(start: boolean) {
    start ? this.startFadingSequentially() : this.stopFading();
  }

  cleanup() {
    this.stopFading();
  }

  initializing(start: boolean = true) {
    this.console.info("initializing...");
    this.toggleLeds(start);
  }

  listening(start: boolean = true) {
    this.console.info("listening...");
    this.toggleLeds(start);
  }

  talking(start: boolean = true) {
    this.console.info("talking...");
    this.toggleLeds(start);
  }

  thinking(start: boolean = true) {
    this.console.info("thinking...");
    this.toggleLeds(start);
  }

  standby(start: boolean = true) {
    this.console.info("waiting...");
    this.toggleLeds(start);
  }
}
