import { createMessage, Gemo, State, TimerEngine } from '@gemo'
import { RedisStore } from '@gemo/store/redis-store.ts'
import { Redis } from 'ioredis'
import { BetCommand } from './commands/bet-command'
import { StartGameCommand } from './commands/start-game-command'
import { LuckyBingoRound } from './round/lucky-bingo-round'
import { createUser } from './services/create-user'
import type { Bet } from './types'

const gemo = Gemo.create('Luck Bingo', {
    server: {
        auth(token) {
            if (token) return createUser()
            else return null
        },
    },
    commands: [
        { code: 200, commands: [StartGameCommand] },
        { code: 201, commands: [BetCommand] },
    ],
    store: new RedisStore(new Redis(), 'Lucky Bingo'),
}).listen(4000)

export const room = gemo.rooms.create<Bet, Bet>('main', {
    autoJoin: true,
    round: LuckyBingoRound,
    engine: new TimerEngine({ duration: 181, lockAt: 151, control: { type: 'single' } }),
})

room.round.events.subscribe((round) => {
    const roundValues = round.values

    if (round.state === State.Concluded) {
        console.log(round)
        if (round.result?.user) {
            room.pool
                .get(round.result.sessionId)
                ?.send(
                    createMessage(103, { result: 'WIN', card: round.result.card.card, cardId: round.result.card.id })
                )
        }
        round.bets?.placed
            .filter((bet) => bet.card.id !== round.result?.card.id)
            .forEach((bet) => {
                room.pool
                    .get(bet.sessionId)
                    ?.send(createMessage(103, { result: 'LOSE', card: bet.card.card, cardId: bet.card.id }))
            })
    }

    room.send(
        createMessage(101, {
            id: roundValues.id,
            number: roundValues.number,
            state: roundValues.state,
            timer: roundValues.timer,
            draw: round.metadata?.draw,
            total: round.metadata?.total,
        })
    )
})
