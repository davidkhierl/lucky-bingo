import { Gemo, TimerEngine } from '@gemo'
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
}).listen(3000)

const room = gemo.rooms.create('main', {
    autoJoin: true,
    round: LuckyBingoRound,
    engine: new TimerEngine({ duration: 10, lockAt: 3, control: { type: 'single' } }),
})

room.round.events.subscribe((round) => {
    const message = JSON.stringify({ code: 103, ...round.toJSON() })
    room.send(message)
})

// TODO: Bet processor
// TODO: Reward processor
