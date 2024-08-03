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

export type ActionPayload<R> = Pick<Round<R>, 'timer' | 'metadata'>
type RoundNumber = Pick<Round, 'number'>

export type PreparingPayload<R> = ActionPayload<R> & Partial<RoundNumber>
export type ReadyPayload<R> = ActionPayload<R> & Partial<RoundNumber>
export type StartingPayload<R> = ActionPayload<R>
export type StartPayload<R> = ActionPayload<R>
export type LockingPayload<R> = ActionPayload<R>
export type LockPayload<R> = ActionPayload<R>
export type ConcludingPayload<R> = ActionPayload<R>
export type ConcludePayload<R> = ActionPayload<R> & Pick<Round<R>, 'result'>
export type TickPayload<R> = ActionPayload<R>
export type ErrorPayload = { error?: unknown }

export interface PayloadAction<T extends ActionType, P> extends Action {
    type: T
    payload?: P
}

export type Preparing<R> = PayloadAction<'PREPARING', PreparingPayload<R>>
export type Ready<R> = PayloadAction<'READY', ReadyPayload<R>>
export type Starting<R> = PayloadAction<'STARTING', StartingPayload<R>>
export type Start<R> = PayloadAction<'START', StartPayload<R>>
export type Locking<R> = PayloadAction<'LOCKING', LockingPayload<R>>
export type Lock<R> = PayloadAction<'LOCK', LockPayload<R>>
export type Concluding<R> = PayloadAction<'CONCLUDING', ConcludingPayload<R>>
export type Conclude<R> = PayloadAction<'CONCLUDE', ConcludePayload<R>>
export type Tick<R> = PayloadAction<'TICK', TickPayload<R>>
export type ErrorRound = PayloadAction<'ERROR', ErrorPayload>

export type StateAction<R> =
    | Preparing<R>
    | Ready<R>
    | Starting<R>
    | Start<R>
    | Locking<R>
    | Lock<R>
    | Concluding<R>
    | Conclude<R>
    | Tick<R>
    | ErrorRound

export type OnReady<R> = Promisable<ReadyPayload<R> | undefined>
export type OnStart<R> = Promisable<StartPayload<R> | undefined>
export type OnLock<R> = Promisable<LockPayload<R> | undefined>
export type OnConclude<R> = Promisable<ConcludePayload<R>>
export type OnTick<R> = Promisable<TickPayload<R> | undefined>

export interface AsyncActionRetry {
    retry: number
    delay: number
}
