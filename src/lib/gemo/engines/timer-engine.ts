import {
    BehaviorSubject,
    identity,
    interval,
    repeat,
    scan,
    Subject,
    Subscription,
    switchMap,
    takeUntil,
    takeWhile,
    tap,
} from 'rxjs'
import { GemoError, logger, State, type RoundState } from '..'
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
    public readonly signal = new Subject<void>()
    private readonly timerState = new BehaviorSubject<boolean>(true)
    private roundCycle?: Subscription

    constructor(options: TimerEngineOptions) {
        this.duration = options.duration
        this.frequency = options.frequency || 1000
        this.lockAt = options.lockAt || 0
        this.control = options.control || { type: 'single' }
    }

    public async start(round: RoundState<U>) {
        console.log('start', this.signal.closed, this.timerState.closed)
        if (this.signal.closed && this.timerState.closed) throw new GemoError('Engine is already destroyed')

        if (this.roundCycle && !this.roundCycle.closed)
            throw new GemoError('Engine is still processing an active round cycle')

        return (this.roundCycle = interval(this.frequency)
            .pipe(
                takeUntil(this.signal),
                switchMap(() => this.timerState.pipe(takeWhile((state) => state))),
                scan((currentTimer) => --currentTimer, this.duration + 1),
                takeWhile((timer) => timer >= 0),
                tap(async (timer) => {
                    this.timerState.next(false)
                    await this.handleTimer(timer, round)
                    this.timerState.next(true)
                }),
                tap({
                    complete: () => {
                        logger.success(`Round ${round.events.value.number} completed`)
                    },
                }),
                this.control.type === 'continues'
                    ? repeat({ delay: this.control.delay ? this.control.delay * 1000 : undefined })
                    : identity
            )
            .subscribe())
    }

    private async handleTimer(timer: number, round: RoundState<U>) {
        if (timer === this.duration) {
            await round.ready()
            round.start({ timer })
            return
        }

        if (timer === this.lockAt) {
            if (round.events.value.state !== State.Locked) {
                round.lock({ timer })
            }
            if (this.lockAt === 0) {
                await round.conclude({ timer })
            }
            return
        }

        if (timer === 0 && round.events.value.state !== State.Concluded) {
            await round.conclude({ timer })
            return
        }

        if (timer > 0) {
            round.tick({ timer })
        }
    }

    public destroy(): void {
        // TODO
        console.log('destroy')
        this.signal.complete()
        this.timerState.complete()
        if (this.roundCycle) this.roundCycle.unsubscribe()
    }
}
