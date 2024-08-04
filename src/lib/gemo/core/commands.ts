import { destr } from 'destr'
import type { Constructor } from 'type-fest'
import { Room, type ServerWebSocket, messageCommandSchema } from '..'
import { logger } from '../utils/logger'
import type { Command } from './command'

export class Commands<U> {
    private readonly commands = new Map<number, Command<U>>()

    public add(code: number, ...commands: Constructor<Command<U>>[]) {
        this.get(code) && console.warn(`Command with code ${code} already exists, overwriting command.`)

        const command = commands.reduceRight(
            (prevCommand: Command<U> | undefined, command: new (command?: Command<U>) => Command<U>) =>
                new command(prevCommand),
            undefined
        ) as Command<U>

        this.commands.set(code, command)
    }

    public get(code: number) {
        return this.commands.get(code)
    }

    public execute<R, B>(ws: ServerWebSocket<U>, message: string | Buffer, room: Room<R, B, U>): boolean {
        const code = this.parseMessageCode(message)
        if (!code) return false

        const command = this.get(code)

        if (!command) {
            logger.debug(`Command with code ${code} does not exist.`)
            return false
        }

        command.execute(ws, message, room)

        return true
    }

    public remove(code: number) {
        return this.commands.delete(code)
    }

    private parseMessageCode(message: string | Buffer): number | undefined {
        const parsedMessage = destr(typeof message === 'string' ? message : message.toString())
        const { success, data } = messageCommandSchema.safeParse(parsedMessage)
        if (success) return data.code
    }
}
