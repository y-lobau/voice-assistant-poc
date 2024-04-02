import { Blinkt } from "blinkt-kit";
import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback";

export class BlinktController implements IVisualFeedback {
  blinkt = new Blinkt({ clearOnExit: true });
  private intervals: NodeJS.Timeout[] = [];

  private clearIntervals(): void {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    this.blinkt.clear();
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
    this.handleEvent(start, [255, 255, 255], 0.1, true);
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

    this.startInterval(
      () => {
        if (isSequential || isBackAndForth) this.blinkt.off();

        if (isSequential) {
          this.blinkt.setPixel(currentLED, ...color, 0.5);
          currentLED = (currentLED + 1) % 8;
        } else if (isBackAndForth) {
          this.blinkt.setPixel(currentLED, ...color, 0.5);
          currentLED += direction;
          if (currentLED === 7 || currentLED === 0) direction *= -1;
        } else {
          this.blinkt.setAll(...color, brightness);
        }

        if (isPulsing) {
          if (increasing) {
            brightness += 0.1;
            if (brightness >= 1) increasing = false;
          } else {
            brightness -= 0.1;
            if (brightness <= 0.1) increasing = true;
          }
        }

        this.blinkt.show();
      },
      isSequential || isBackAndForth ? 500 : 200
    );
  }
}
