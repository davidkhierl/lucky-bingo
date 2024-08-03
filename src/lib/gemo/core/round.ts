import { type OnConclude, type OnLock, type OnReady, type OnStart, type OnTick, State } from '..'

export type RoundMetadata = any

export interface RoundValue {
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
    public result: R | null = null
    public metadata?: RoundMetadata
    public error?: string

    constructor(id: string) {
        this.id = id
        this.number = 0
        this.state = State.Idle
    }

    public onReady?(): OnReady<R>
    public onStart?(metadata?: RoundMetadata): OnStart<R>
    public onLock?(metadata?: RoundMetadata): OnLock<R>
    public abstract onConclude(metadata?: RoundMetadata): OnConclude<R>
    public concludeWhen?(): boolean
    public onTick?(metadata?: RoundMetadata): OnTick<R>

    public get values() {
        const round = {
            id: this.id,
            number: this.number,
            state: this.state,
            result: this.result,
        } as RoundValue

        if (this.timer) round.timer = this.timer
        if (this.metadata) round.metadata = this.metadata
        if (this.error) round.error = this.error

        return round
    }
}
