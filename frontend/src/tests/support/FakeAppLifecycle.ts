import type { AppLifecycle } from '@/application/ports/AppLifecycle'

export class FakeAppLifecycle implements AppLifecycle {
    reloads = 0

    reload(): void {
        this.reloads++
    }
}
