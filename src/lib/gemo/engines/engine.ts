import type { Subscription } from 'rxjs'
import type { Promisable } from 'type-fest'
import type { RoundState } from '..'

export interface Engine<U> {
    start(round: RoundState<U>): Promisable<Subscription | void>
    complete(): void
    destroy(): void
}
