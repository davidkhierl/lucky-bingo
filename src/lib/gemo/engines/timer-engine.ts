import { BehaviorSubject, identity, interval, repeat, scan, switchMap, takeWhile, tap } from 'rxjs'
import { logger, State, type RoundState } from '..'
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
    private readonly timerState = new BehaviorSubject<boolean>(true)

    constructor(options: TimerEngineOptions) {
        this.duration = options.duration
        this.frequency = options.frequency || 1000
        this.lockAt = options.lockAt || 0
        this.control = options.control || { type: 'single' }
    }

    public async start(round: RoundState<U>) {
        return interval(this.frequency)
            .pipe(
                switchMap(() =>
                    this.timerState.pipe(
                        takeWhile((state) => state) // Continue only if the timer is running
                    )
                ),
                scan((currentTimer) => --currentTimer, this.duration + 1),
                takeWhile((timer) => timer >= 0),
                tap(async (timer) => {
                    this.timerState.next(false)
                    await this.handleTimer(timer, round)
                    this.timerState.next(true)
                }),
                this.control.type === 'continues' ? repeat({ delay: this.control.delay }) : identity
            )
            .subscribe({
                complete: () => {
                    logger.success(`Round ${round.events.value.number} completed`)
                },
            })
    }

    private async handleTimer(timer: number, round: RoundState<U>) {
        if (timer === this.duration) {
            await round.ready()
            round.start({ timer })
        } else if (timer === this.lockAt) {
            if (round.events.value.state !== State.Locked) round.lock({ timer })
            if (this.lockAt === 0) await round.conclude({ timer })
        } else if (timer === 0) await round.conclude({ timer })
        else round.tick({ timer })
    }
}
