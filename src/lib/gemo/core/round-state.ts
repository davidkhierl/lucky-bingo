import defu from 'defu'
import { nanoid } from 'nanoid'
import { BehaviorSubject, scan, Subject } from 'rxjs'
import type { Constructor } from 'type-fest'
import { logger, Room, type Round, type Store } from '..'

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

export type ReadyPayload = Partial<Pick<Round, 'number' | 'timer'>>

export interface Ready extends Action {
    type: 'READY'
    payload?: ReadyPayload
}

export type StartPayload = Partial<Pick<Round, 'timer'>>

export interface Start extends Action {
    type: 'START'
    payload?: StartPayload
}

export type LockPayload = Partial<Pick<Round, 'timer'>>

export interface Lock extends Action {
    type: 'LOCK'
    payload?: LockPayload
}

export type ConcludePayload<Result = any> = Partial<Pick<Round, 'timer'>> & { result: Result }

export interface Conclude<Result = any> extends Action {
    type: 'CONCLUDE'
    payload: ConcludePayload<Result>
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
        private readonly roundConstructor: Constructor<Round, [string]>
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

                const timer = _round.timer ? ` timer: ${_round.timer}` : ''
                logger.info(`Round ${_round.number}${timer} ${State[_round.state]}`)

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

                const timer = round.timer ? ` timer: ${round.timer}` : ''
                logger.info(`Round ${round.number}${timer} ${State[round.state]}`)

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

                const timer = round.timer ? ` timer: ${round.timer}` : ''
                logger.info(`Round ${round.number}${timer} ${State[round.state]}`)

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

                const timer = round.timer ? ` timer: ${round.timer}` : ''
                logger.info(`Round ${round.number}${timer} ${State[round.state]} Result: ${round.result}`)

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

                const timer = round.timer ? ` timer: ${round.timer}` : ''
                logger.debug(`Round ${round.number}${timer} ${State[round.state]}`)

                return round
            }

            default:
                return round
        }
    }

    public async ready() {
        const payload = await this._round.onReady()

        let number = 0

        let _number = await this.store.get<number>(`${this.room.name}:round`)
        if (_number) number = await this.store.set<number>(`${this.room.name}:round`, _number + 1)
        else number = await this.store.set<number>(`${this.room.name}:round`, number + 1)

        this.action.next({
            type: 'READY',
            payload: {
                ...payload,
                number,
            },
        })
    }

    public async start() {
        const payload = await this._round.onStart()
        this.action.next({
            type: 'START',
            payload,
        })
    }

    public async lock() {
        const payload = await this._round.onLock()
        this.action.next({
            type: 'LOCK',
            payload,
        })
    }

    public async conclude() {
        const payload = await this._round.onConclude()
        this.action.next({
            type: 'CONCLUDE',
            payload,
        })
    }

    public tick(payload: TickPayload) {
        this.action.next({
            type: 'TICK',
            payload,
        })
    }

    public async run() {
        await this.ready()
        await this.start()
        await this.lock()
        await this.conclude()
    }
}
