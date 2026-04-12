import time
import lgpio
from movement_detector import DisplayState, MotionSensor, ScreenToggle

SENSOR_PIN = 4
GPIO_CHIP = lgpio.gpiochip_open(0)


def loop():
    print("Start display state loop")
    motion_sensor = MotionSensor(SENSOR_PIN, GPIO_CHIP)
    screen_toggle = ScreenToggle()
    while True:
        if motion_sensor.multi_motion_is_detected(5):
            print("Turn display on")
            screen_toggle.set_screen_state(DisplayState.on)
        else:
            print("Turn display off")
            screen_toggle.set_screen_state(DisplayState.off)
        time.sleep(1)


if __name__ == '__main__':
    try:
        loop()
    except KeyboardInterrupt:
        lgpio.gpiochip_close(GPIO_CHIP)
