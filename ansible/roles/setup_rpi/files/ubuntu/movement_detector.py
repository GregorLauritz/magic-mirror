import subprocess
import lgpio
import time
from enum import Enum

POLL_INTERVAL_S = 0.05


class DisplayState(str, Enum):
    on = 'on'
    off = 'off'


class ScreenToggle:
    def __init__(self):
        self._current_screen_state = DisplayState.off

    def set_screen_state(self, state: DisplayState) -> None:
        if self._current_screen_state != state:
            subprocess.run(
                ["xset", "-display", ":0.0", "dpms", "force", state])
            self._current_screen_state = state


class MotionSensor:
    def __init__(self, pin: int, chip: int):
        self._pin = pin
        self._chip = chip
        lgpio.gpio_claim_input(self._chip, self._pin)

    def motion_is_detected(self) -> bool:
        return lgpio.gpio_read(self._chip, self._pin) == 1

    def multi_motion_is_detected(self, count: int = 5) -> bool:
        threshold = count / 2
        readings = []
        for _ in range(count):
            readings.append(self.motion_is_detected())
            time.sleep(POLL_INTERVAL_S)
        return sum(readings) >= threshold
