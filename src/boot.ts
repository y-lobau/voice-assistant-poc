// Import the SPI device type definitions
import { open } from "spi-device";

export function indicateBoot() {
  // Open the SPI device
  const ledStrip = open(
    0,
    0,
    { mode: 0, maxSpeedHz: 1000000 },
    (err: Error | null) => {
      if (err) {
        console.error("Error opening SPI device:", err);
        return;
      }

      // Start frame: four bytes of zeros
      const startFrame = Buffer.from([0x00, 0x00, 0x00, 0x00]);

      // LED frame: setting brightness and color (AA for brightness and FF for Red component)
      const ledFrame = Buffer.from([0xaa, 0x00, 0x00, 0xff]); // Full brightness red, note: brightness should be 0xE0 to 0xFF

      // End frame: four bytes of zeros to ensure data latches
      const endFrame = Buffer.alloc(4, 0x00);

      // Concatenate all parts of the message
      const data = Buffer.concat([startFrame, ledFrame, endFrame]);

      // Prepare and send the message to the SPI device
      ledStrip.transfer(
        [
          {
            sendBuffer: data,
            byteLength: data.length,
            speedHz: 1000000,
          },
        ],
        (error: Error | null, message) => {
          if (error) {
            console.error("Failed to send SPI message:", error);
          } else {
            console.log("SPI message sent successfully");
          }

          // Close the SPI device
          ledStrip.close((err: Error | null) => {
            if (err) {
              console.error("Error closing SPI device:", err);
            }
          });
        }
      );
    }
  );
}
