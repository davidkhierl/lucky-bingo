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

export interface RoundJson {
    id: string
    number: number
    state: State
    timer?: number
    result?: unknown
    metadata?: RoundMetadata
    error?: string
}

export abstract class Round<R = unknown> {
    public readonly id: string
    public number: number
    public timer?: number
    public state: State
    public result?: R
    public metadata?: RoundMetadata
    public error?: string

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

    public get value() {
        const round = {
            id: this.id,
            number: this.number,
            state: this.state,
            result: null,
        } as RoundJson

        if (this.timer) round.timer = this.timer
        if (this.result) round.result = this.result
        if (this.metadata) round.metadata = this.metadata
        if (this.error) round.error = this.error

        return round
    }
}
