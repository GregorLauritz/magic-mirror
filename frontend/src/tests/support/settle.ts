/**
 * Lets every pending promise continuation run (a real macrotask), so a test can
 * observe state that is only reached after a chain of awaits.
 */
export const settle = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 0))
