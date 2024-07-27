import { Gemo } from '@gemo'
import { BetCommand } from './commands/bet-command'
import { createUser } from './services/create-user'

const gemo = Gemo.create({
    server: {
        auth(token) {
            if (token) return createUser()
            else return null
        },
    },
    commands: [{ code: 200, commands: [BetCommand] }],
}).listen(3000)

const room = gemo.rooms.create('main', { autoJoin: true })

// TODO: Commands
// TODO: Round engine
// TODO: Bet processor
// TODO: Reward processor
