import spi from 'spi-device';

// Open SPI bus
const ledStrip = spi.open(0, 0, err => {
  if (err) throw err;
});

// Function to send data to the LED strip
const sendLedData = (data) => {
  const message = [{
    sendBuffer: Buffer.from(data),
    byteLength: data.length,
    speedHz: 2000000 // SPI speed
  }];

  ledStrip.transfer(message, (err) => {
    if (err) throw err;
  });
};

// Function to turn on LEDs in yellow color
const turnOnLEDs = () => {
  const startFrame = [0x00, 0x00, 0x00, 0x00];
  const endFrame = [0xFF, 0xFF, 0xFF, 0xFF];
  const ledFrames = [];
  const yellow = [0xFF, 0xFF, 0x00]; // GRB format for yellow

  for (let i = 0; i < 3; i++) {
    ledFrames.push(0xE0 + 31, ...yellow); // Full brightness
  }

  const data = [].concat(startFrame, ledFrames, endFrame);
  sendLedData(data);
};

// Function to turn off LEDs
const turnOffLEDs = () => {
  const startFrame = [0x00, 0x00, 0x00, 0x00];
  const endFrame = [0xFF, 0xFF, 0xFF, 0xFF];
  const ledFrames = [];

  for (let i = 0; i < 3; i++) {
    ledFrames.push(0xE0, 0x00, 0x00, 0x00); // Off (zero brightness)
  }

  const data = [].concat(startFrame, ledFrames, endFrame);
  sendLedData(data);
};

// Example usage
turnOnLEDs(); // This will turn on the LEDs in yellow
setTimeout(turnOffLEDs, 5000); // This will turn off the LEDs after 2 seconds
