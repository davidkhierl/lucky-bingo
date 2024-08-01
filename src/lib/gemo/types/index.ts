import type { Round } from '@/lib/gemo'

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

export type PreparingPayload = Partial<Pick<Round, 'number' | 'timer' | 'metadata'>>

export interface Preparing extends Action {
    type: 'PREPARING'
    payload?: PreparingPayload
}

export type ReadyPayload = Partial<Pick<Round, 'number' | 'timer' | 'metadata'>>

export interface Ready extends Action {
    type: 'READY'
    payload?: ReadyPayload
}

export type StartingPayload = Pick<Round, 'timer' | 'metadata'>

export interface Starting extends Action {
    type: 'STARTING'
    payload?: StartingPayload
}

export type StartPayload = Pick<Round, 'timer' | 'metadata'>

export interface Start extends Action {
    type: 'START'
    payload?: StartPayload
}

export type LockingPayload = Pick<Round, 'timer' | 'metadata'>

export interface Locking extends Action {
    type: 'LOCKING'
    payload?: LockingPayload
}

export type LockPayload = Pick<Round, 'timer' | 'metadata'>

export interface Lock extends Action {
    type: 'LOCK'
    payload?: LockPayload
}

export type ConcludingPayload<R> = Pick<Round<R>, 'timer' | 'metadata'>

export interface Concluding<R> extends Action {
    type: 'CONCLUDING'
    payload?: ConcludingPayload<R>
}

export type ConcludePayload<R> = Pick<Round<R>, 'timer' | 'metadata'> & Required<Pick<Round, 'result'>>

export interface Conclude<R> extends Action {
    type: 'CONCLUDE'
    payload: ConcludePayload<R>
}

export type TickPayload = Pick<Round, 'timer' | 'metadata'>

export interface Tick extends Action {
    type: 'TICK'
    payload: TickPayload
}

export type ErrorPayload = { error?: unknown }

export interface ErrorRound extends Action {
    type: 'ERROR'
    payload: ErrorPayload
}

export type StateAction<R = any> =
    | Preparing
    | Ready
    | Starting
    | Start
    | Locking
    | Lock
    | Concluding<R>
    | Conclude<R>
    | Tick
    | ErrorRound
