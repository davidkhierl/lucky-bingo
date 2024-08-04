import type { Subscription } from 'rxjs'
import type { Promisable } from 'type-fest'
import type { RoundState } from '..'

export interface Engine<R, B, U> {
    start(round: RoundState<R, B, U>): Promisable<Subscription | void>
    complete(): void
    destroy(): void
}
