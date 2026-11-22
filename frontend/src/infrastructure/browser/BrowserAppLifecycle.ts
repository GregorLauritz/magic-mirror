import type { AppLifecycle } from '@/application/ports/AppLifecycle'

export class BrowserAppLifecycle implements AppLifecycle {
    reload(): void {
        window.location.reload()
    }
}
