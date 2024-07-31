import type { Promisable } from 'type-fest'
import {
    type ConcludePayload,
    type LockPayload,
    type ReadyPayload,
    type StartPayload,
    State,
    type TickPayload,
} from '..'

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

    public onReady?(): Promisable<ReadyPayload | undefined>
    public onStart?(metadata?: RoundMetadata): StartPayload | undefined
    public onLock?(metadata?: RoundMetadata): LockPayload | undefined
    public onConclude?(metadata?: RoundMetadata): Promisable<ConcludePayload<R>>
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
