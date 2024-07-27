export class GemoError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options)
    }
}
