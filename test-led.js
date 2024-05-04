import spi from 'spi-device';

const RGB_MAP = {
    'rgb': [3, 2, 1],
    'rbg': [3, 1, 2],
    'grb': [2, 3, 1],
    'gbr': [2, 1, 3],
    'brg': [1, 3, 2],
    'bgr': [1, 2, 3]
  };
  
  class APA102 {
    constructor(numLed, globalBrightness = 31, order = 'rgb', bus = 0, device = 1, maxSpeedHz = 8000000) {
      this.numLed = numLed;
      this.order = order.toLowerCase();
      this.rgb = RGB_MAP[this.order] || RGB_MAP['rgb'];
      this.globalBrightness = Math.min(globalBrightness, 31);
      this.leds = new Array(this.numLed * 4).fill(0);
      this.spi = spi.open(bus, device, {
        mode: spi.MODE0,
        maxSpeedHz: maxSpeedHz
      });
    }
  
    sendFrame(bytes) {
      return new Promise((resolve, reject) => {
        const message = [{
          sendBuffer: Buffer.from(bytes),
          byteLength: bytes.length,
          speedHz: this.spi.maxSpeedHz
        }];
        this.spi.transfer(message, (err, message) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  
    async clockStartFrame() {
      await this.sendFrame([0, 0, 0, 0]); // Start frame
    }
  
    async clockEndFrame() {
      await this.sendFrame(new Array((this.numLed / 2 + 1) & ~0x03).fill(0xFF));
    }
  
    async show() {
      await this.clockStartFrame();
      await this.sendFrame(this.leds);
      await this.clockEndFrame();
    }
  
    setPixel(ledNum, red, green, blue, brightPercent = 100) {
      if (ledNum < 0 || ledNum >= this.numLed) return;
      const brightness = Math.ceil(brightPercent * this.globalBrightness / 100.0);
      const ledStart = (brightness & 0x1F) | 0xE0;
      const index = 4 * ledNum;
      this.leds[index] = ledStart;
      this.leds[index + this.rgb[0]] = red;
      this.leds[index + this.rgb[1]] = green;
      this.leds[index + this.rgb[2]] = blue;
    }
  
    cleanup() {
      this.spi.close();
    }
  
    static combineColor(red, green, blue) {
      return (red << 16) | (green << 8) | blue;
    }
  
    wheel(wheelPos) {
      if (wheelPos > 255) wheelPos = 255;
      if (wheelPos < 85) {
        return APA102.combineColor(wheelPos * 3, 255 - wheelPos * 3, 0);
      } else if (wheelPos < 170) {
        wheelPos -= 85;
        return APA102.combineColor(255 - wheelPos * 3, 0, wheelPos * 3);
      } else {
        wheelPos -= 170;
        return APA102.combineColor(0, wheelPos * 3, 255 - wheelPos * 3);
      }
    }
  }
  
  module.exports = APA102;

  const apa = new APA102(3);
  apa.setPixel(0, 255, 0, 0);