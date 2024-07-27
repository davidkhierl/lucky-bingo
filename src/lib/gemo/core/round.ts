import {
    State,
    type ConcludePayload,
    type LockPayload,
    type ReadyPayload,
    type StartPayload,
    type TickPayload,
} from './round-state'

export type StatePayload<T, R = false, C = R extends true ? T : T | undefined> = C | Promise<T>

export type OnReady = StatePayload<ReadyPayload>
export type OnStart = StatePayload<StartPayload>
export type OnLock = StatePayload<LockPayload>
export type OnConclude<R> = StatePayload<ConcludePayload<R>, true>
export type OnTick = StatePayload<TickPayload>

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

    public abstract onReady(): OnReady
    public abstract onStart(): OnStart
    public abstract onLock(): OnLock
    public abstract onConclude(): OnConclude<R>
    public onTick?(): OnTick
}
