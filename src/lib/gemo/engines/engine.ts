import type { Subscription } from 'rxjs'
import type { RoundState } from '../core/round-state'

export interface Engine<U> {
    start(round: RoundState<U>): Subscription
}
