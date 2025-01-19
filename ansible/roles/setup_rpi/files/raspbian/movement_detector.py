import subprocess
import RPi.GPIO as GPIO
import time
from enum import Enum


class DisplayState(str, Enum):
    on = 'on'
    off = 'off'


class ScreenToggle:
    def __init__(self):
        self._currentScreenState = "off"

    def setScreenState(self, state: DisplayState) -> None:
        if self._currentScreenState != state:
            subprocess.run(
                ["xset", "-display", ":0.0", "dpms", "force", state])
            self._currentScreenState = state


class MotionSensor:
    def __init__(self, pin: int):
        self._pin = pin
        GPIO.setup(self._pin, GPIO.IN)

    def motionIsDetected(self) -> bool:
        return GPIO.input(self._pin) == GPIO.HIGH

    def multiMotionIsDetect(self, count: int = 5):
        res = []
        threshold = count / 2
        while count > 0:
            res.append(self.motionIsDetected())
            count = count - 1
            time.sleep(50/1000)
        return sum(res) >= threshold
