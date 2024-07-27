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
export type OnConclude = StatePayload<ConcludePayload, true>
export type OnTick = StatePayload<TickPayload>

export abstract class Round {
    public readonly id: string
    public number: number
    public timer: number | null
    public state: State
    public result: null | any

    constructor(id: string) {
        this.id = id
        this.number = 0
        this.timer = null
        this.state = State.Idle
    }

    public abstract onReady(): OnReady
    public abstract onStart(): OnStart
    public abstract onLock(): OnLock
    public abstract onConclude(): OnConclude
    public onTick?(): OnTick
}
