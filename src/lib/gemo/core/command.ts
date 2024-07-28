import type { Room, ServerWebSocket } from '..'

export type CommandNext = () => void

export abstract class Command<U> {
    private readonly _next: Command<U> | undefined

    constructor(command?: Command<U>) {
        this._next = command
    }

    public async execute(ws: ServerWebSocket<U>, message: string | Buffer, room: Room<U>) {
        const next = () => {
            if (this._next) this._next.handle(ws, message, room, () => {})
        }
        this.handle(ws, message, room, next)
    }

    protected abstract handle(ws: ServerWebSocket<U>, message: string | Buffer, room: Room<U>, next: CommandNext): void
}
