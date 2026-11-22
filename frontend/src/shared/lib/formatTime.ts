export const parseTime = (time: number): string => {
    return time.toString().padStart(2, '0')
}
