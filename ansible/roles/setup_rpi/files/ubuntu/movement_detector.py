import subprocess
import lgpio
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
    def __init__(self, pin: int, LGIO_CHIP: any):
        self._pin = pin
        self._LGIO_CHIP = LGIO_CHIP
        lgpio.gpio_claim_input(self._LGIO_CHIP, self._pin)

    def motionIsDetected(self) -> bool:
        return lgpio.gpio_read(self._LGIO_CHIP, self._pin) == 1

    def multiMotionIsDetect(self, count: int = 5):
        res = []
        threshold = count / 2
        while count > 0:
            res.append(self.motionIsDetected())
            count = count - 1
            time.sleep(50/1000)
        return sum(res) >= threshold
