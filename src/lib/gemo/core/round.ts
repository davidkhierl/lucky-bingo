import type { Promisable } from 'type-fest'
import {
    State,
    type ConcludePayload,
    type LockPayload,
    type ReadyPayload,
    type StartPayload,
    type TickPayload,
} from './round-state'

export type RoundMetadata = Record<string, any>

export abstract class Round<R = unknown> {
    public readonly id: string
    public number: number
    public timer?: number
    public state: State
    public result?: R
    public metadata?: RoundMetadata

    constructor(id: string) {
        this.id = id
        this.number = 0
        this.state = State.Idle
    }

    public abstract onReady(): Promisable<ReadyPayload | undefined>
    public abstract onStart(metadata?: RoundMetadata): StartPayload | undefined
    public abstract onLock(metadata?: RoundMetadata): LockPayload | undefined
    public abstract onConclude(metadata?: RoundMetadata): Promisable<ConcludePayload<R>>
    public onTick?(metadata?: RoundMetadata): TickPayload | undefined

    public toJSON() {
        return {
            id: this.id,
            number: this.number,
            state: this.state,
            timer: this.timer,
            result: this.result,
            metadata: this.metadata,
        }
    }
}
