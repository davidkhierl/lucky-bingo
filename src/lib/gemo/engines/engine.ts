import type { Subject, Subscription } from 'rxjs'
import type { Promisable } from 'type-fest'
import type { RoundState } from '../core/round-state'

export interface Engine<U> {
    start(round: RoundState<U>): Promisable<Subscription | void>
    signal: Subject<void>
    destroy(): void
}
