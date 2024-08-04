import type { Round } from '@/lib/gemo'
import type { Promisable } from 'type-fest'

export type Data = string | ArrayBufferView | ArrayBuffer | SharedArrayBuffer

export enum State {
    Idle,
    Preparing,
    Ready,
    Starting,
    Started,
    Locking,
    Locked,
    Concluding,
    Concluded,
    Error,
}

export type ActionType =
    | 'PREPARING'
    | 'READY'
    | 'STARTING'
    | 'START'
    | 'LOCKING'
    | 'LOCK'
    | 'CONCLUDING'
    | 'CONCLUDE'
    | 'TICK'
    | 'ERROR'

export interface Action {
    type: ActionType
}

export type ActionPayload<R, B> = Pick<Round<R, B>, 'timer' | 'metadata'>
type RoundNumber<R, B> = Pick<Round<R, B>, 'number'>

export type PreparingPayload<R, B> = ActionPayload<R, B> & Partial<RoundNumber<R, B>>
export type ReadyPayload<R, B> = ActionPayload<R, B> & Partial<RoundNumber<R, B>>
export type StartingPayload<R, B> = ActionPayload<R, B>
export type StartPayload<R, B> = ActionPayload<R, B>
export type LockingPayload<R, B> = ActionPayload<R, B>
export type LockPayload<R, B> = ActionPayload<R, B>
export type ConcludingPayload<R, B> = ActionPayload<R, B>
export type ConcludePayload<R, B> = ActionPayload<R, B> & Pick<Round<R, B>, 'result'>
export type TickPayload<R, B> = ActionPayload<R, B>
export type ErrorPayload = { error?: unknown }

export interface PayloadAction<T extends ActionType, P> extends Action {
    type: T
    payload?: P
}

export type Preparing<R, B> = PayloadAction<'PREPARING', PreparingPayload<R, B>>
export type Ready<R, B> = PayloadAction<'READY', ReadyPayload<R, B>>
export type Starting<R, B> = PayloadAction<'STARTING', StartingPayload<R, B>>
export type Start<R, B> = PayloadAction<'START', StartPayload<R, B>>
export type Locking<R, B> = PayloadAction<'LOCKING', LockingPayload<R, B>>
export type Lock<R, B> = PayloadAction<'LOCK', LockPayload<R, B>>
export type Concluding<R, B> = PayloadAction<'CONCLUDING', ConcludingPayload<R, B>>
export type Conclude<R, B> = PayloadAction<'CONCLUDE', ConcludePayload<R, B>>
export type Tick<R, B> = PayloadAction<'TICK', TickPayload<R, B>>
export type ErrorRound = PayloadAction<'ERROR', ErrorPayload>

export type StateAction<R, B> =
    | Preparing<R, B>
    | Ready<R, B>
    | Starting<R, B>
    | Start<R, B>
    | Locking<R, B>
    | Lock<R, B>
    | Concluding<R, B>
    | Conclude<R, B>
    | Tick<R, B>
    | ErrorRound

export type OnReady<R, B> = Promisable<ReadyPayload<R, B> | undefined>
export type OnStart<R, B> = Promisable<StartPayload<R, B> | undefined>
export type OnLock<R, B> = Promisable<LockPayload<R, B> | undefined>
export type OnConclude<R, B> = Promisable<ConcludePayload<R, B>>
export type OnTick<R, B> = Promisable<TickPayload<R, B> | undefined>

export interface AsyncActionRetry {
    retry: number
    delay: number
}
