import defu from 'defu'
import { nanoid } from 'nanoid'
import { BehaviorSubject, scan, Subject } from 'rxjs'
import type { Constructor } from 'type-fest'
import { GemoError, logger, Room, type Engine, type Round, type Store } from '..'

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

export type ConcludingPayload<R> = Pick<Round<R>, 'timer' | 'result' | 'metadata'>

export interface Concluding<R> extends Action {
    type: 'CONCLUDING'
    payload?: ConcludingPayload<R>
}

export type ConcludePayload<R> = Pick<Round<R>, 'timer' | 'result' | 'metadata'>

export interface Conclude<R> extends Action {
    type: 'CONCLUDE'
    payload: ConcludePayload<R>
}

export type TickPayload = Pick<Round, 'timer' | 'metadata'>

export interface Tick extends Action {
    type: 'TICK'
    payload: TickPayload
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

export class RoundState<U> {
    private readonly action = new Subject<StateAction>()
    public readonly events: BehaviorSubject<Round>
    private _round: Round

    constructor(
        private readonly room: Room<U>,
        private readonly store: Store,
        private readonly roundConstructor: Constructor<Round, [string]>,
        private readonly engine?: Engine<U>
    ) {
        this._round = new this.roundConstructor(nanoid())
        this.events = new BehaviorSubject<Round>(this._round)
        this.action.pipe(scan(this._actionHandler.bind(this), this._round)).subscribe(this.events)
    }

    private _actionHandler(round: Round, action: StateAction): Round {
        switch (action.type) {
            case 'PREPARING': {
                if (round.state !== State.Idle && round.state !== State.Concluded) {
                    logger.error(
                        `Failed to prepare round because it is currently in ${State[round.state]} state, expected ${State[State.Idle]} or ${State[State.Concluded]} state`
                    )
                    return round
                }

                logger.start(`Preparing round${action.payload?.number ? ` ${action.payload.number}` : ''} ...`)
                let _round = round.state === State.Idle ? round : (this._round = new this.roundConstructor(nanoid()))
                _round.state = State.Preparing
                Object.assign(_round, defu(action.payload, _round))
                return _round
            }
            case 'READY': {
                if (round.state !== State.Preparing) {
                    logger.error(
                        `Failed to ready round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Preparing]} state`
                    )
                    return round
                }

                round.state = State.Ready
                Object.assign(round, defu(action.payload, round))
                const timer = round.timer ? ` timer: ${round.timer}` : ''
                logger.info(`Round ${round.number} ${State[round.state]}${timer}`)
                return round
            }

            case 'STARTING': {
                if (round.state !== State.Ready) {
                    logger.error(
                        `Failed to start round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Ready]} state`
                    )
                    return round
                }

                logger.start(`Starting round ${round.number} ...`)
                round.state = State.Starting
                Object.assign(round, defu(action.payload, round))
                return round
            }

            case 'START': {
                if (round.state !== State.Starting) {
                    logger.error(
                        `Failed to start round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Starting]} state`
                    )
                    return round
                }

                round.state = State.Started
                Object.assign(round, defu(action.payload, round))
                const timer = typeof round.timer !== 'undefined' ? ` timer: ${round.timer}` : ''
                logger.info(`Round ${round.number} ${State[round.state]}${timer}`)
                return round
            }

            case 'LOCKING': {
                if (round.state !== State.Started) {
                    logger.error(
                        `Failed to lock round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Started]} state`
                    )
                    return round
                }

                logger.start(`Locking round ${round.number} ...`)
                round.state = State.Locking
                Object.assign(round, defu(action.payload, round))
                return round
            }

            case 'LOCK': {
                if (round.state !== State.Locking) {
                    logger.error(
                        `Failed to lock round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Locking]} state`
                    )
                    return round
                }

                round.state = State.Locked
                Object.assign(round, defu(action.payload, round))
                const timer = typeof round.timer !== 'undefined' ? ` timer: ${round.timer}` : ''
                logger.info(`Round ${round.number} ${State[round.state]}${timer}`)
                return round
            }

            case 'CONCLUDING': {
                if (round.state !== State.Locked) {
                    logger.error(
                        `Failed to conclude round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Locked]} state`
                    )
                    return round
                }

                logger.start(`Concluding round ${round.number}, Waiting for results ...`)
                round.state = State.Concluding
                Object.assign(round, defu(action.payload, round))
                return round
            }

            case 'CONCLUDE': {
                if (round.state !== State.Concluding) {
                    logger.error(
                        `Failed to conclude round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Concluding]} state`
                    )
                    return round
                }

                round.state = State.Concluded
                Object.assign(round, defu(action.payload, round))
                Object.freeze(round)
                const timer = typeof round.timer !== 'undefined' ? ` timer: ${round.timer}` : ''
                logger.info(`Round ${round.number} ${State[round.state]}${timer} Result: ${round.result}`)
                return round
            }

            case 'TICK': {
                if (round.state !== State.Started && round.state !== State.Locked) {
                    logger.error(
                        `Failed to tick round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Started]} or ${State[State.Locked]} state`
                    )
                    return round
                }

                Object.assign(round, defu(action.payload, round))
                const timer = typeof round.timer !== 'undefined' ? ` timer: ${round.timer}` : ''
                logger.debug(`Round ${round.number} ${State[round.state]}${timer}`)
                return round
            }

            default:
                return round
        }
    }

    private async generateRoundNumber() {
        let number = 0
        let _number = await this.store.get<number>(`${this.room.name}:round`)
        if (_number) number = await this.store.set<number>(`${this.room.name}:round`, _number + 1)
        else number = await this.store.set<number>(`${this.room.name}:round`, number + 1)
        return number
    }

    public async ready(payload?: ReadyPayload) {
        const number = await this.generateRoundNumber()
        this.action.next({
            type: 'PREPARING',
            payload: {
                number,
                ...payload,
            },
        })

        if (this._round.state !== State.Preparing) return
        const _roundPayload = defu(payload, await this._round.onReady())
        this.action.next({
            type: 'READY',
            payload: _roundPayload,
        })
    }

    public start(payload?: StartPayload) {
        this.action.next({
            type: 'STARTING',
            payload,
        })

        if (this._round.state !== State.Starting) return
        const _roundPayload = defu(payload, this._round.onStart(this._round.metadata))
        this.action.next({
            type: 'START',
            payload: _roundPayload,
        })
    }

    public lock(payload?: LockPayload) {
        this.action.next({
            type: 'LOCKING',
            payload,
        })

        if (this._round.state !== State.Locking) return
        const _roundPayload = defu(payload, this._round.onLock(this._round.metadata))
        this.action.next({
            type: 'LOCK',
            payload: _roundPayload,
        })
    }

    public async conclude<T>(payload?: Omit<ConcludePayload<T>, 'result'>) {
        this.action.next({
            type: 'CONCLUDING',
            payload,
        })

        if (this._round.state !== State.Concluding) return
        const _roundPayload = defu(payload, await this._round.onConclude(this._round.metadata))
        this.action.next({
            type: 'CONCLUDE',
            payload: _roundPayload,
        })
    }

    public async tick(payload: TickPayload) {
        const _roundPayload = this._round.onTick ? defu(payload, this._round.onTick(this._round.metadata)) : payload
        this.action.next({
            type: 'TICK',
            payload: _roundPayload,
        })
    }

    public async run() {
        if (this._round.state !== State.Idle && this._round.state !== State.Concluded) {
            const error = new GemoError(
                `Failed to run round because it is currently in ${State[this._round.state]} state, expected ${State[State.Idle]} or ${State[State.Concluded]} state`
            )
            logger.error(error)
            // this.events.error(error)
            return
        }

        if (this.engine) this.engine.start(this)
        else {
            await this.ready()
            this.start()
            this.lock()
            await this.conclude()
        }
    }
}
