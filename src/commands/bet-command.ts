import { Command, type CommandNext, type ServerWebSocket, logger } from '@/lib/gemo'

export class BetCommand<U> extends Command<U> {
    protected handle(ws: ServerWebSocket<U>, message: string | Buffer, next: CommandNext): void {
        logger.info(message, 'Bet command executed')
        ws.send('Bet command executed')
    }
}
