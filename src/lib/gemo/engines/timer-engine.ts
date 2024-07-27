import { identity, repeat, scan, takeWhile, timer } from 'rxjs'
import { logger, type RoundState } from '..'
import type { Engine } from './engine'

export type TimerEngineType = { type: 'single' } | { type: 'continues'; delay?: number }

export interface TimerEngineOptions {
    duration: number
    frequency?: number
    lockAt?: number
    control?: TimerEngineType
}

export class TimerEngine<U> implements Engine<U> {
    public readonly duration: number
    public readonly frequency: number
    public readonly lockAt: number
    public readonly control: TimerEngineType

    constructor(options: TimerEngineOptions) {
        this.duration = options.duration
        this.frequency = options.frequency || 1000
        this.lockAt = options.lockAt || 0
        this.control = options.control || { type: 'single' }
    }

    public start(round: RoundState<U>) {
        return timer(0, this.frequency)
            .pipe(
                scan((currentTimer) => --currentTimer, this.duration + 1),
                takeWhile((timer) => timer >= 0),
                this.control.type === 'continues' ? repeat({ delay: this.control.delay }) : identity
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
