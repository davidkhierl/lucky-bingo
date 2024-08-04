import { nanoid } from 'nanoid'
import {
    BehaviorSubject,
    firstValueFrom,
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
import { GemoError, logger, State, type AsyncActionRetry, type RoundState } from '..'
import type { Engine } from './engine'

export type TimerEngineType = { type: 'single' } | { type: 'continues'; delay?: number }

export interface TimerEngineOptions {
    duration: number
    frequency?: number
    lockAt?: number
    control?: TimerEngineType
    onError?: AsyncActionRetry
}

export class TimerEngine<R, B, U> implements Engine<R, B, U> {
    public readonly id = nanoid()
    public readonly duration: number
    public readonly frequency: number
    public readonly lockAt: number
    public readonly control: TimerEngineType
    private readonly _onError?: AsyncActionRetry
    private readonly _signal = new Subject<void>()
    private readonly _pause = new BehaviorSubject<boolean>(true)
    private _cycle?: Subscription

    constructor(options: TimerEngineOptions) {
        this.duration = options.duration
        this.frequency = options.frequency || 1000
        this.lockAt = options.lockAt || 0
        this.control = options.control || { type: 'single' }
        this._onError = options.onError
    }

    public async start(round: RoundState<R, B, U>) {
        if (this._signal.closed || this._pause.closed) {
            const error = new GemoError(`Error starting ${TimerEngine.name} ${this.id} already destroyed`)
            logger.error(error.message)
            return
        }

        if (this._cycle && !this._cycle.closed) {
            const error = new GemoError(`Fail to start ${TimerEngine.name} is still processing an active round`)
            logger.fail(error.message)
            return
        }

        return (this._cycle = interval(this.frequency)
            .pipe(
                takeUntil(this._signal),
                switchMap(() => this._pause.pipe(takeWhile((state) => state))),
                scan((currentTimer) => --currentTimer, this.duration + 1),
                takeWhile((timer) => timer >= 0),
                tap(async (timer) => {
                    this._pause.next(false)
                    await this.handleTimer(timer, round)
                    this._pause.next(true)
                }),
                tap({
                    complete: () => {
                        logger.success(
                            `Round ${round.events.value.number} completed on ${State[round.events.value.state]} state`
                        )
                    },
                }),
                this.control.type === 'continues'
                    ? repeat({ delay: this.control.delay ? this.control.delay * 1000 : undefined })
                    : identity
            )
            .subscribe())
    }

    private async handleTimer(timer: number, round: RoundState<R, B, U>) {
        if (
            round.events.value.state === State.Locked &&
            round.events.value.concludeWhen &&
            round.events.value.concludeWhen()
        ) {
            await firstValueFrom(round.conclude(undefined, this._onError))
            return
        }

        if (timer === this.duration) {
            await firstValueFrom(round.ready(undefined, this._onError))
            if (round.events.value.state === State.Ready) round.start({ timer })
            return
        }

        if (timer === this.lockAt) {
            if (round.events.value.state !== State.Locked) {
                round.lock({ timer })
            }
            if (this.lockAt === 0) {
                await firstValueFrom(round.conclude({ timer }, this._onError))
            }
            return
        }

        if (timer === 0 && round.events.value.state !== State.Concluded) {
            await firstValueFrom(round.conclude({ timer }, this._onError))
            return
        }

        if (timer > 0) {
            round.tick({ timer })
        }
    }

    public complete() {
        this._signal.next()
    }

    public destroy(): void {
        if (this._signal.closed && this._pause.closed) return
        if (this._cycle) this._cycle.unsubscribe()
        this._pause.unsubscribe()
        this._signal.unsubscribe()
        logger.debug(`${TimerEngine.name} ${this.id} destroyed`)
    }
}
