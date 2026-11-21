import { loadConfig } from '../app/config'

// Transitional bridge: legacy modules that still read module-level constants
// get their values from the validated AppConfig instead of raw
// `import.meta.env`. Removed once the last constant consumer has moved to the
// composition root (see the hexagonal refactor plan, step S11).
export const runtimeConfig = loadConfig(import.meta.env)
