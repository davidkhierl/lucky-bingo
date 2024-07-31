import { Gemo, TimerEngine } from '@gemo'
import { RedisStore } from '@gemo/store/redis-store.ts'
import { Redis } from 'ioredis'
import { BetCommand } from './commands/bet-command'
import { LuckyBingoRound } from './round/lucky-bingo-round'
import { createUser } from './services/create-user'

const gemo = Gemo.create('Luck Bingo', {
    server: {
        auth(token) {
            if (token) return createUser()
            else return null
        },
    },
    commands: [{ code: 200, commands: [BetCommand] }],
    store: new RedisStore(new Redis(), 'Lucky Bingo'),
}).listen(3000)

const room = gemo.rooms.create('main', {
    autoJoin: true,
    round: LuckyBingoRound,
    engine: new TimerEngine({ duration: 10, lockAt: 5, control: { type: 'continues' } }),
})

void room.round.run()
