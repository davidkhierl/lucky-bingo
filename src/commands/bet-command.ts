import { Command, Room, State, type ServerWebSocket } from '@/lib/gemo'

export class BetCommand<U> extends Command<U> {
    protected async handle(ws: ServerWebSocket<U>, message: string | Buffer, room: Room<U>): Promise<void> {
        if (room.round.events.value.state === State.Concluded) await room.round.run()
        else await room.round.conclude()
    }
}
