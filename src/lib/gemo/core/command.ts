import type { ServerWebSocket } from '..'

export type CommandNext = () => void

export abstract class Command<U> {
    private readonly _next: Command<U> | undefined

    constructor(command?: Command<U>) {
        this._next = command
    }

    public async execute(ws: ServerWebSocket<U>, message: string | Buffer) {
        const next = () => {
            if (this._next) this._next.handle(ws, message, () => {})
        }
        this.handle(ws, message, next)
    }

    protected abstract handle(ws: ServerWebSocket<U>, message: string | Buffer, next: CommandNext): void
}
