import defu from 'defu'
import { nanoid } from 'nanoid'
import {
    BehaviorSubject,
    catchError,
    concatMap,
    delay,
    firstValueFrom,
    of,
    retry,
    scan,
    Subject,
    switchMap,
    takeWhile,
    tap,
} from 'rxjs'
import type { Constructor } from 'type-fest'
import {
    GemoError,
    logger,
    Room,
    State,
    type AsyncActionRetry,
    type ConcludingPayload,
    type Engine,
    type LockingPayload,
    type PreparingPayload,
    type Round,
    type StartingPayload,
    type StateAction,
    type Store,
    type TickPayload,
} from '..'

export class RoundState<R, U> {
    public readonly events: BehaviorSubject<Round<R>>
    private readonly _action = new Subject<StateAction<R>>()
    private _round: Round<R>
    private _destroyed = false

    constructor(
        private readonly room: Room<R, U>,
        private readonly store: Store,
        private readonly Round: Constructor<Round<R>, [string]>,
        private readonly engine?: Engine<R, U>
    ) {
        this._round = new this.Round(nanoid())
        this.events = new BehaviorSubject<Round<R>>(this._round)
        this._action.pipe(scan(this._actionHandler.bind(this), this._round)).subscribe(this.events)
    }

    private _actionHandler(round: Round<R>, action: StateAction<R>): Round<R> {
        switch (action.type) {
            case 'PREPARING': {
                if (round.state !== State.Idle && round.state !== State.Concluded && round.state !== State.Error) {
                    logger.fail(
                        `Failed to prepare round because it is currently in ${State[round.state]} state, expected ${State[State.Idle]} or ${State[State.Concluded]} state or ${State[State.Error]} state`
                    )
                    return round
                }

                let _round = round.state === State.Idle ? round : (this._round = new this.Round(nanoid()))
                _round.state = State.Preparing
                Object.assign(_round, defu(action.payload, _round))

                const timer = _round.timer ? ` timer: ${_round.timer}` : ''
                logger.start(`Round ${_round.number} ${State[_round.state]}${timer}`)

                return _round
            }
            case 'READY': {
                if (round.state !== State.Preparing) {
                    logger.fail(
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
                    logger.fail(
                        `Starting round ${round.number} failed because it is currently in ${State[round.state]} state, expected ${State[State.Ready]} state`
                    )
                    return round
                }

                round.state = State.Starting
                Object.assign(round, defu(action.payload, round))

                const timer = round.timer ? ` timer: ${round.timer}` : ''
                logger.start(`Round ${round.number} ${State[round.state]}${timer}`)

                return round
            }

            case 'START': {
                if (round.state !== State.Starting) {
                    logger.fail(
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
                    logger.fail(
                        `Failed to lock round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Started]} state`
                    )
                    return round
                }

                round.state = State.Locking
                Object.assign(round, defu(action.payload, round))

                const timer = round.timer ? ` timer: ${round.timer}` : ''
                logger.start(`Round ${round.number} ${State[round.state]}${timer}`)

                return round
            }

            case 'LOCK': {
                if (round.state !== State.Locking) {
                    logger.fail(
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
                    logger.fail(
                        `Failed to conclude round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Locked]} state`
                    )
                    return round
                }

                round.state = State.Concluding
                Object.assign(round, defu(action.payload, round))

                const timer = typeof round.timer !== 'undefined' ? ` timer: ${round.timer}` : ''
                logger.start(`Round ${round.number} ${State[round.state]}${timer} Waiting for results`)

                return round
            }

            case 'CONCLUDE': {
                if (round.state !== State.Concluding) {
                    logger.fail(
                        `Failed to conclude round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Concluding]} state`
                    )
                    return round
                }

                round.state = State.Concluded
                Object.assign(round, defu(action.payload, round))
                Object.freeze(round)

                const timer = typeof round.timer !== 'undefined' ? ` timer: ${round.timer}` : ''
                logger.info(`Round ${round.number} ${State[round.state]}${timer} Result: ${round.result}`)

                this.engine?.complete()

                return round
            }

            case 'TICK': {
                if (round.state !== State.Started && round.state !== State.Locked) {
                    logger.fail(
                        `Failed to tick round ${round.number} because it is currently in ${State[round.state]} state, expected ${State[State.Started]} or ${State[State.Locked]} state`
                    )
                    return round
                }

                Object.assign(round, defu(action.payload, round))
                const timer = typeof round.timer !== 'undefined' ? ` timer: ${round.timer}` : ''
                logger.debug(`Round ${round.number} ${State[round.state]}${timer}`)
                return round
            }

            case 'ERROR': {
                round.state = State.Error
                Object.assign(round, defu(action.payload, round))
                Object.freeze(round)
                logger.error(
                    `Round ${round.number} ${State[round.state]}${action.payload?.error ? `: ${action.payload.error}` : ''}`
                )
                this.engine?.complete()
                return round
            }

            default:
                return round
        }
    }

    /**
     * Asynchronously prepares and starts a round.
     *
     * @param payload - The payload to be passed to the action.
     * @param options - The options for async action retry.
     */
    public ready(payload?: PreparingPayload<R>, options?: AsyncActionRetry) {
        return of(this.store.incr.bind(this.store)).pipe(
            concatMap(async (preparePayload) => preparePayload(`${this.room.name}:round`)),
            tap((number) => {
                this._action.next({
                    type: 'PREPARING',
                    payload: {
                        number,
                        ...payload,
                    },
                })
            }),
            takeWhile(() => this._round.state === State.Preparing),
            switchMap(() => {
                if (!this._round.onReady) return of(undefined)
                return of(this._round.onReady?.bind(this._round)).pipe(
                    concatMap(async (readyPayload) => readyPayload()),
                    retry({
                        count: options?.retry || 3,
                        delay: (error, retryCount) => {
                            logger.warn(
                                `Failed to ready round, retrying... Attempt ${retryCount}/${options?.retry || 3}`
                            )
                            return of(error).pipe(delay(options?.delay ? options.delay * 1000 : 0))
                        },
                    })
                )
            }),
            tap({
                next: (payload) => {
                    this._action.next({
                        type: 'READY',
                        payload,
                    })
                },
                error: (error) => {
                    this._action.next({
                        type: 'ERROR',
                        payload: {
                            error: error instanceof Error ? error.message : 'Failed to ready round.',
                        },
                    })
                },
            })
        )
    }

    /**
     * Starts the round with the given payload.
     *
     * @param {StartPayload} payload - The payload to start the process with.
     * @returns {void}
     */
    public start(payload?: StartingPayload<R>): void {
        this._action.next({
            type: 'STARTING',
            payload,
        })

        if (this._round.state !== State.Starting) return
        const _roundPayload = this._round.onStart ? defu(payload, this._round.onStart(this._round.metadata)) : payload
        this._action.next({
            type: 'START',
            payload: _roundPayload,
        })
    }

    /**
     * Locks the round with the given payload and prevents placing any more bets.
     *
     * @param {LockPayload} [payload] - The payload to be locked.
     *
     * @return {void}
     */
    public lock(payload?: LockingPayload<R>): void {
        this._action.next({
            type: 'LOCKING',
            payload,
        })

        if (this._round.state !== State.Locking) return
        const _roundPayload = this._round.onLock ? defu(payload, this._round.onLock(this._round.metadata)) : payload
        this._action.next({
            type: 'LOCK',
            payload: _roundPayload,
        })
    }

    /**
     * Conclude the round and retrieve result.
     *
     * Triggers a concluding action and returns an Observable.
     *
     * @param {ConcludingPayload<unknown>} payload - The payload for the concluding action.
     * @param {AsyncActionRetry} options - The options for retrying the asynchronous action.
     */
    public conclude(payload?: ConcludingPayload<R>, options?: AsyncActionRetry) {
        return of(this._round.onConclude.bind(this._round)).pipe(
            tap(() =>
                this._action.next({
                    type: 'CONCLUDING',
                    payload,
                })
            ),
            takeWhile(() => this._round.state === State.Concluding),
            concatMap(async (concludePayload) => concludePayload(this._round.metadata)),
            retry({
                count: options?.retry || 3,
                delay: (error, retryCount) => {
                    logger.warn(
                        `Failed to retrieve round results, retrying... Attempt ${retryCount}/${options?.retry || 3}`
                    )
                    return of(error).pipe(delay(options?.delay ? options.delay * 1000 : 0))
                },
            }),
            tap({
                next: (payload) => {
                    this._action.next({
                        type: 'CONCLUDE',
                        payload,
                    })
                },
                error: (error) => {
                    this._action.next({
                        type: 'ERROR',
                        payload: {
                            error: error instanceof Error ? error.message : 'Failed to retrieve round results.',
                        },
                    })
                },
            }),
            catchError(() => of(undefined))
        )
    }

    /**
     * Performs a tick operation.
     *
     * @param {TickPayload} payload - The payload to be used for the tick operation.
     *
     * @return {void} - This method doesn't return a value.
     */
    public tick(payload: TickPayload<R>): void {
        const _roundPayload = this._round.onTick ? defu(payload, this._round.onTick(this._round.metadata)) : payload
        this._action.next({
            type: 'TICK',
            payload: _roundPayload,
        })
    }

    /**
     * Runs the round in the room.
     *
     * If an engine is enabled, the round will be started using the engine.
     * Otherwise, the round will go through the following steps:
     * 1. Wait for the round to become ready.
     * 2. Start the round.
     * 3. Lock the round.
     * 4. Conclude the round.
     *
     * @return {Promise<void>} A promise that resolves when the round has finished. If an error occurs, the promise will be rejected with the error.
     */
    public async run(): Promise<void> {
        if (this._destroyed) {
            const error = new GemoError(`Room ${this.room.name} round state already destroyed`)
            logger.error(error)
            return
        }

        if (this._round.state !== State.Idle && this._round.state !== State.Concluded) {
            const error = new GemoError(
                `Failed to run round because it is currently in ${State[this._round.state]} state, expected ${State[State.Idle]} or ${State[State.Concluded]} state`
            )
            logger.fail(error)
            return
        }
        if (this.engine) this.engine.start(this)
        else {
            await firstValueFrom(this.ready())
            this.start()
            this.lock()
            await firstValueFrom(this.conclude())
        }
    }

    /**
     * Weather the round state is destroyed or not.
     *
     * @returns {boolean} - A boolean value indicating if the round state is destroyed or not.
     */
    public get destroyed() {
        return this._destroyed
    }

    /**
     * Destroys the instance of RoundState.
     *
     * @memberof RoundState
     */
    public destroy() {
        if (this._action.closed || this.events.closed) return
        this._action.unsubscribe()
        this.events.unsubscribe()
        this._destroyed = true
        logger.debug(`Room ${this.room.name} RoundState destroyed`)
    }
}
