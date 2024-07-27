import { Gemo } from '@gemo'
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

const room = gemo.rooms.create('main', { autoJoin: true, round: LuckyBingoRound })

// room.round.events.subscribe((round) => {
//     console.log(round)
// })

await room.round.run()

// TODO: Round engine
// TODO: Bet processor
// TODO: Reward processor
