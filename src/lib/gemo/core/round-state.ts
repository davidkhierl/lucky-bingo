import defu from 'defu'
import { nanoid } from 'nanoid'
import { BehaviorSubject, scan, Subject } from 'rxjs'
import type { Constructor } from 'type-fest'
import { logger, Room, type Engine, type Round, type Store } from '..'

export enum State {
    Idle,
    Ready,
    Started,
    Locked,
    Concluded,
}

export type ActionType = 'READY' | 'START' | 'LOCK' | 'CONCLUDE' | 'TICK'

export interface Action {
    type: ActionType
}

export type ReadyPayload = Pick<Round, 'timer' | 'number'>

export interface Ready extends Action {
    type: 'READY'
    payload?: ReadyPayload
}

export type StartPayload = Pick<Round, 'timer'>

export interface Start extends Action {
    type: 'START'
    payload?: StartPayload
}

export type LockPayload = Pick<Round, 'timer'>

export interface Lock extends Action {
    type: 'LOCK'
    payload?: LockPayload
}

export type ConcludePayload<R> = Pick<Round<R>, 'timer' | 'result'>

export interface Conclude<R> extends Action {
    type: 'CONCLUDE'
    payload: ConcludePayload<R>
}

export type TickPayload = Pick<Round, 'timer'>

export interface Tick extends Action {
    type: 'TICK'
    payload: TickPayload
}

export type StateAction<Result = any> = Ready | Start | Lock | Conclude<Result> | Tick

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
            case 'READY': {
                let _round = round.state === State.Idle ? round : (this._round = new this.roundConstructor(nanoid()))

                if (_round.state !== State.Idle && _round.state !== State.Concluded) {
                    logger.error(
                        `Failed to ready round ${_round.number} because it is currently in ${State[_round.state]} state, expected ${State[State.Idle]} or ${State[State.Concluded]} state`
                    )

                    return _round
                }

                _round.state = State.Ready
                Object.assign(_round, defu(action.payload, _round))

                const timer = typeof round.timer !== 'undefined' ? ` timer: ${round.timer}` : ''
                logger.info(`Round ${_round.number} ${State[_round.state]}${timer}`)

                return _round
            }

            case 'START': {
                if (round.state !== State.Ready) {
                    logger.error(
                        `Failed to start round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Ready]} state`
                    )

                    return round
                }

                round.state = State.Started
                Object.assign(round, defu(action.payload, round))

                const timer = typeof round.timer !== 'undefined' ? ` timer: ${round.timer}` : ''
                logger.info(`Round ${round.number} ${State[round.state]}${timer}`)

                return round
            }

            case 'LOCK': {
                if (round.state !== State.Started) {
                    logger.error(
                        `Failed to lock round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Started]} state`
                    )
                    return round
                }

                round.state = State.Locked
                Object.assign(round, defu(action.payload, round))

                const timer = typeof round.timer !== 'undefined' ? ` timer: ${round.timer}` : ''
                logger.info(`Round ${round.number} ${State[round.state]}${timer}`)

                return round
            }
            case 'CONCLUDE': {
                if (round.state !== State.Locked) {
                    logger.error(
                        `Failed to conclude round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Locked]} state`
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

    public async ready(payload?: ReadyPayload) {
        const _roundPayload = defu(payload, await this._round.onReady())

        let number = 0

        let _number = await this.store.get<number>(`${this.room.name}:round`)
        if (_number) number = await this.store.set<number>(`${this.room.name}:round`, _number + 1)
        else number = await this.store.set<number>(`${this.room.name}:round`, number + 1)

        this.action.next({
            type: 'READY',
            payload: {
                ..._roundPayload,
                number,
            },
        })
    }

    public async start(payload?: StartPayload) {
        const _roundPayload = defu(payload, await this._round.onStart())
        this.action.next({
            type: 'START',
            payload: _roundPayload,
        })
    }

    public async lock(payload?: LockPayload) {
        const _roundPayload = defu(payload, await this._round.onLock())
        this.action.next({
            type: 'LOCK',
            payload: _roundPayload,
        })
    }

    public async conclude<T>(payload?: Omit<ConcludePayload<T>, 'result'>) {
        const _roundPayload = defu(payload, await this._round.onConclude())

        this.action.next({
            type: 'CONCLUDE',
            payload: _roundPayload,
        })
    }

    public async tick(payload: TickPayload) {
        const _roundPayload = this._round.onTick ? defu(payload, await this._round.onTick()) : payload
        this.action.next({
            type: 'TICK',
            payload: _roundPayload,
        })
    }

    public async run() {
        if (this.engine) this.engine.start(this)
        else {
            await this.ready()
            await this.start()
            await this.lock()
            await this.conclude()
        }
    }
}
