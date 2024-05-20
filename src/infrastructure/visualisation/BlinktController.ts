import { Blinkt } from "blinkt-kit";
import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback";

export class BlinktController implements IVisualFeedback {
  blinkt = new Blinkt({ clearOnExit: true });
  private intervals: NodeJS.Timeout[] = [];

  test() {
    this.blinkt.setAll({ r: 255, g: 0, b: 0, brightness: 0.5 });
    this.blinkt.show();
  }

  private clearIntervals(): void {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    this.blinkt.clear();
    this.blinkt.show(); // Added to apply the clear command to the LEDs
  }

  private startInterval(
    intervalFunction: () => void,
    delay: number
  ): NodeJS.Timeout {
    const interval = setInterval(intervalFunction, delay);
    this.intervals.push(interval);
    return interval;
  }

  initializing(start: boolean = true): void {
    this.handleEvent(start, [255, 255, 255], 0.05, true);
  }

  listening(start: boolean = true): void {
    this.handleEvent(start, [0, 0, 255], 0.5, false, true);
  }

  talking(start: boolean = true): void {
    this.handleEvent(start, [255, 0, 0], 0.5, false, true, true);
  }

  thinking(start: boolean = true): void {
    this.handleEvent(start, [255, 165, 0], 0.5, false);
  }

  waiting(start: boolean = true): void {
    this.handleEvent(start, [0, 255, 0], 0.1, true);
  }

  standby(start: boolean = true): void {
    if (!start) {
      this.clearIntervals();
      return;
    }

    this.clearIntervals(); // Ensure no other animations are running
    let brightness = 0.1;
    let increasing = true;
    const brightnessStep = 0.01; // Smaller step for smoother transition
    const intervalDuration = 20; // Slightly longer duration for smoother updates

    this.startInterval(() => {
      this.blinkt.clear();

      this.blinkt.setPixel({
        pixel: 0, // Very left pixel
        r: 128, // Grey color
        g: 128,
        b: 128,
        brightness,
      });
      this.blinkt.setPixel({
        pixel: 7, // Very right pixel
        r: 128, // Grey color
        g: 128,
        b: 128,
        brightness,
      });

      if (increasing) {
        brightness += brightnessStep;
        if (brightness >= 0.1) increasing = false;
      } else {
        brightness -= brightnessStep;
        if (brightness <= 0) increasing = true;
      }

      this.blinkt.show();
    }, intervalDuration);
  }

  private handleEvent(
    start: boolean,
    color: [number, number, number],
    initialBrightness: number,
    isPulsing: boolean,
    isSequential: boolean = false,
    isBackAndForth: boolean = false
  ): void {
    if (!start) {
      this.clearIntervals();
      return;
    }

    this.clearIntervals(); // Ensure no other animations are running
    let brightness = initialBrightness;
    let increasing = true;
    let currentLED = 0;
    let direction = 1;
    // Smaller step for brightness changes and a shorter interval for smoother transitions
    const brightnessStep = 0.02; // Smaller step for smooth transition
    const intervalDuration = isSequential || isBackAndForth ? 100 : 20; // Shorter duration for more frequent updates

    this.startInterval(() => {
      if (isSequential || isBackAndForth) this.blinkt.clear();

      if (isSequential) {
        this.blinkt.setPixel({
          pixel: currentLED,
          r: color[0],
          g: color[1],
          b: color[2],
          brightness: 0.5,
        });
        currentLED = (currentLED + 1) % 8;
      } else if (isBackAndForth) {
        this.blinkt.setPixel({
          pixel: currentLED,
          r: color[0],
          g: color[1],
          b: color[2],
          brightness: 0.5,
        });
        currentLED += direction;
        if (currentLED === 7 || currentLED === 0) direction *= -1;
      } else {
        this.blinkt.setAll({
          r: color[0],
          g: color[1],
          b: color[2],
          brightness,
        });
      }

      if (isPulsing) {
        if (increasing) {
          brightness += brightnessStep;
          if (brightness >= 1) increasing = false;
        } else {
          brightness -= brightnessStep;
          if (brightness <= initialBrightness) increasing = true;
        }
      }

      this.blinkt.show();
    }, intervalDuration);
  }
}
