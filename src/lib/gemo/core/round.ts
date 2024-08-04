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
    /**
     * Round identifier.
     */
    public readonly id: string

    /**
     * Round number.
     */
    public number: number

    /**
     * Round timer.
     */
    public timer?: number

    /**
     * Round state.
     */
    public state: State

    /**
     * Round result.
     */
    public result: R | null = null

    /**
     * Round metadata.
     */
    public metadata?: RoundMetadata

    /**
     * Round error.
     */
    public error?: string

    constructor(id: string) {
        this.id = id
        this.number = 0
        this.state = State.Idle
    }

    /**
     * A hook that is called when preparing the round.
     */
    public onReady?(): OnReady<R>

    /**
     * A hook that is called when starting the round.
     */
    public onStart?(metadata?: RoundMetadata): OnStart<R>

    /**
     * A hook that is called when locking the round.
     */
    public onLock?(metadata?: RoundMetadata): OnLock<R>

    /**
     * A hook that is called when concluding the round with result.
     */
    public abstract onConclude(metadata?: RoundMetadata): OnConclude<R>

    /**
     * A predicate that determines when the round needs to start concluding.
     */
    public concludeWhen?(): boolean

    /**
     * A hook that is called when the round is ticking.
     */
    public onTick?(metadata?: RoundMetadata): OnTick<R>

    /**
     * Get the round values.
     */
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
