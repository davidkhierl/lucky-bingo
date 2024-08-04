import type { Promisable } from 'type-fest'
import { Bets, type OnConclude, type OnLock, type OnReady, type OnStart, type OnTick, State } from '..'

export type RoundMetadata = any

export interface RoundValue {
    id: string
    number: number
    state: string
    timer?: number
    result?: unknown
    metadata?: RoundMetadata
    error?: string
}

export abstract class Round<R, B> {
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

    public bets?: Bets<B>

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
        if (this.onBet) this.bets = new Bets(this.onBet.bind(this))
    }

    /**
     * A hook that is called when preparing the round.
     */
    public onReady?(): OnReady<R, B>

    /**
     * A hook that is called when starting the round.
     */
    public onStart?(metadata?: RoundMetadata): OnStart<R, B>

    /**
     * A hook that is called when locking the round.
     */
    public onLock?(metadata?: RoundMetadata): OnLock<R, B>

    /**
     * A hook that is called when concluding the round with result.
     */
    public abstract onConclude(metadata?: RoundMetadata): OnConclude<R, B>

    /**
     * A predicate that determines when the round needs to start concluding.
     */
    public concludeWhen?(): boolean

    /**
     * A hook that is called when the round is ticking.
     */
    public onTick?(metadata?: RoundMetadata): OnTick<R, B>

    /**
     * A hook that is called when a bet is placed.
     */
    public onBet?(bet: unknown): Promisable<B>

    /**
     * Get the round values.
     */
    public get values() {
        const round = {
            id: this.id,
            number: this.number,
            state: State[this.state],
            result: this.result,
        } as RoundValue

        if (this.timer) round.timer = this.timer
        if (this.metadata) round.metadata = this.metadata
        if (this.error) round.error = this.error

        return round
    }
}
