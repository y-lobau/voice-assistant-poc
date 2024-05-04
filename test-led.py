import spidev
import time

spi = spidev.SpiDev()
spi.open(0, 0)  # Open bus 0, device 0
spi.max_speed_hz = 8000000

# Simple test to turn on one LED red
start_frame = [0x00, 0x00, 0x00, 0x00]
led_frame = [0xFF, 0xFF, 0x00, 0x00]  # Brightness, Blue, Green, Red
end_frame = [0xFF, 0xFF, 0xFF, 0xFF]
data = start_frame + led_frame + end_frame

spi.xfer(data)
time.sleep(1)
spi.close()
