import { Gemo, State, TimerEngine } from '@gemo'
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
    engine: new TimerEngine({ duration: 10, lockAt: 5, control: { type: 'single' } }),
})

room.round.events.subscribe((round) => {
    let _round = round.toJSON() as any

    // if (
    //     round.state === State.Preparing ||
    //     round.state === State.Starting ||
    //     round.state === State.Locking ||
    //     round.state === State.Concluding
    // )
    //     delete _round.timer
    _round = { ..._round, state: State[_round.state] }

    const message = JSON.stringify({ code: 103, ..._round })
    room.send(message)
})

room.round.run()

// TODO: Bet processor
// TODO: Reward processor
