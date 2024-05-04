// Import the SPI device type definitions
import pkg, { SpiDevice } from "spi-device";
const { open } = pkg;

export class LEDController {
  private ledStrip: SpiDevice | undefined;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Open the SPI device
    this.ledStrip = open(0, 0, { mode: 0, maxSpeedHz: 1000000 }, (err) => {
      if (err) {
        console.error("Error opening SPI device:", err);
        return;
      }
      console.log("Device opened");
    });
  }

  public turnOffLEDs(): void {
    if (!this.ledStrip) {
      console.error("SPI device is not initialized");
      return;
    }

    // Start frame: At least four bytes of zeros (32 bits of zero)
    const startFrame = Buffer.from([0x00, 0x00, 0x00, 0x00]);

    // LED frame to turn off the LEDs: full brightness with zero colors
    const ledFrame = Buffer.from([0xe0, 0x00, 0x00, 0x00]); // Brightness 0 with zero color values

    // End frame: A series of zeros to ensure the data is latched
    const endFrame = Buffer.from([0xff, 0xff, 0xff, 0xff]); // Using 0xFF to ensure all data is flushed through

    // Concatenate all parts of the message
    const data = Buffer.concat([startFrame, ledFrame, endFrame]);

    // Send a single message to turn off the LEDs
    this.ledStrip.transfer(
      [
        {
          sendBuffer: data,
          byteLength: data.length,
          speedHz: 1000000,
        },
      ],
      (error, message) => {
        if (error) {
          console.error("Failed to send SPI message:", error);
        } else {
          console.log("LEDs turned off successfully");
        }
      }
    );
  }

  public cleanup(): void {
    if (this.ledStrip) {
      this.ledStrip.close((err) => {
        if (err) {
          console.error("Error closing SPI device:", err);
        } else {
          console.log("SPI device closed successfully");
        }
      });
    }
  }
}
