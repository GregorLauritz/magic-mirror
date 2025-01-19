import time
import RPi.GPIO as GPIO
from movement_detector import DisplayState, MotionSensor, ScreenToggle

SENDSOR_PIN = 4  # define the sensorPin


def loop():
    print("Start display state loop")
    motionSensor = MotionSensor(SENDSOR_PIN)
    screenToggle = ScreenToggle()
    while True:
        if motionSensor.multiMotionIsDetect(5):
            print("Turn display on")
            screenToggle.setScreenState(DisplayState.on)
        else:
            print("Turn display off")
            screenToggle.setScreenState(DisplayState.off)
        time.sleep(1)


if __name__ == '__main__':  # Program start from here
    GPIO.setmode(GPIO.BCM)
    try:
        loop()
    # When 'Ctrl+C' is pressed, the child program destroy() will be executed.
    except KeyboardInterrupt:
        GPIO.cleanup()
