import { Command, type CommandNext, Room, type ServerWebSocket, logger } from '@/lib/gemo'

export class BetCommand<U> extends Command<U> {
    protected async handle(
        ws: ServerWebSocket<U>,
        message: string | Buffer,
        room: Room<U>,
        next: CommandNext
    ): Promise<void> {
        logger.info(message, 'Bet command executed')
        await room.round.run()
        ws.send('Bet command executed')
    }
}
