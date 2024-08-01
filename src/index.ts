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
    engine: new TimerEngine({ duration: 10, lockAt: 5, control: { type: 'single' } }),
})

void room.round.run()

// import { concatMap, from } from 'rxjs'
//
// function willComplete(duration: number) {
//     return new Promise<number>((resolve) => {
//         setTimeout(() => {
//             resolve(duration)
//         }, duration)
//     })
// }
//
// from([willComplete(2000), willComplete(10000), willComplete(3000)])
//     .pipe(concatMap((promise) => promise))
//     .subscribe({
//         next: (value) => console.log('Next', value),
//         complete: () => console.log('Complete'),
//         error: (err) => console.error(err),
//     })
