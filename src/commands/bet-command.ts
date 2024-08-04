import { Command, createMessage, messageCommandSchema, Room, type ServerWebSocket } from '@/lib/gemo'
import type { Bet, User, UserBet } from '@/types'
import destr from 'destr'
import { z } from 'zod'

export class BetCommand extends Command<User> {
    protected async handle(
        ws: ServerWebSocket<User>,
        message: string | Buffer,
        room: Room<Bet, UserBet, User>
    ): Promise<void> {
        if (ws.data.isAnonymous) return
        const user = ws.data.user

        const { success, data } = betSchema.safeParse(destr(message))

        if (!success) {
            ws.send(createMessage(4000, { error: 'Invalid message' }))
            return
        }

        if (data.quantity < 1) {
            ws.send(createMessage(4000, { error: 'Invalid quantity' }))
            return
        }

        Array.from({ length: data.quantity }).forEach(() => {
            room.round.bet({ user, ws })
        })
    }
}

export const betSchema = messageCommandSchema.extend({
    quantity: z.number().int().positive(),
})
