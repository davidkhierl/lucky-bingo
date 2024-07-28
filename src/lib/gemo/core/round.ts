import type { Promisable } from 'type-fest'
import {
    State,
    type ConcludePayload,
    type LockPayload,
    type ReadyPayload,
    type StartPayload,
    type TickPayload,
} from './round-state'

// export type StatePayload<T, R extends boolean = false, C = R extends true ? T : T | undefined> = C | PromiseLike<C>

// export type OnReady = StatePayload<ReadyPayload>
// export type OnStart = StatePayload<StartPayload>
// export type OnLock = StatePayload<LockPayload>
// export type OnConclude<R> = StatePayload<ConcludePayload<R>, true>
// export type OnTick = StatePayload<TickPayload>

export abstract class Round<R = unknown> {
    public readonly id: string
    public number: number
    public timer?: number
    public state: State
    public result?: R

    constructor(id: string) {
        this.id = id
        this.number = 0
        this.state = State.Idle
    }

    public abstract onReady(): Promisable<ReadyPayload | undefined>
    public abstract onStart(): StartPayload | undefined
    public abstract onLock(): LockPayload | undefined
    public abstract onConclude(): Promisable<ConcludePayload<R>>
    public onTick?(): TickPayload | undefined

    public toJSON() {
        return {
            id: this.id,
            number: this.number,
            state: State[this.state],
            timer: this.timer,
            result: this.result,
        }
    }
}
