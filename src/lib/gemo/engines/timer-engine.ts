import { scan, takeWhile, timer } from 'rxjs'
import { logger, type RoundState } from '..'
import type { Engine } from './engine'

export interface TimedEngineOptions {
    duration: number
    frequency?: number
    lockAt?: number
}

export class TimerEngine<U> implements Engine<U> {
    public readonly duration: number
    public readonly frequency: number
    public readonly lockAt: number

    constructor(options: TimedEngineOptions) {
        this.duration = options.duration
        this.frequency = options.frequency || 1000
        this.lockAt = options.lockAt || 0
    }

    public start(round: RoundState<U>) {
        return timer(0, this.frequency)
            .pipe(
                scan((currentTimer) => --currentTimer, this.duration + 1),
                takeWhile((timer) => timer >= 0)
            )
            .subscribe({
                next: async (timer) => {
                    if (timer === this.duration) {
                        await round.ready()
                        round.start({ timer })
                    } else if (timer === this.lockAt) {
                        round.lock({ timer })
                        if (this.lockAt === 0) round.conclude({ timer })
                    } else if (timer === 0) round.conclude({ timer })
                    else round.tick({ timer })
                },
                complete: () => {
                    logger.success(`Round ${round.events.value.number} completed`)
                },
            })
    }
}
