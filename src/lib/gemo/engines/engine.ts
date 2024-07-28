import type { Subscription } from 'rxjs'
import type { Promisable } from 'type-fest'
import type { RoundState } from '../core/round-state'

export interface Engine<U> {
    start(round: RoundState<U>): Promisable<Subscription>
}
