export function createMessage<D extends Record<string, any>>(code: number, data: D): string {
    return JSON.stringify({ code, ...data })
}
