import { Command, Room, type ServerWebSocket } from '@/lib/gemo'
import type { Bet, User, UserBet } from '@/types'

export class StartGameCommand extends Command<User> {
    protected async handle(
        ws: ServerWebSocket<User>,
        message: string | Buffer,
        room: Room<Bet, UserBet, User>
    ): Promise<void> {
        room.round.run()
    }
}
