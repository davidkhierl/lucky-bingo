import type { Server as BunServer } from 'bun'
import { randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:stream'
import { from, tap } from 'rxjs'
import type { Constructor } from 'type-fest'
import {
    Commands,
    GemoError,
    logger,
    Pool,
    Round,
    RoundState,
    Server,
    type Data,
    type Engine,
    type ServerWebSocket,
    type Store,
} from '..'

/**
 * Options for creating a Room.
 */
export interface RoomOptions<R, U> {
    /**
     * Name of the room.
     * This is also used as the channel name for the room.
     * Sockets that join the room will be automatically subscribed to this channel.
     */
    name: string

    /**
     * Maximum number of players allowed in the room.
     *
     * @default Infinity
     */
    maxPlayers?: number

    /**
     * Whether spectators are allowed in the room.
     *
     * @default true
     */
    allowSpectators?: boolean

    /**
     * Maximum number of spectators allowed in the room.
     *
     * @default Infinity
     */
    maxSpectators?: number

    /**
     * Whether to automatically join players to the room whenever a new connection is established from the server.
     * If set to true, manual joining is disabled.
     */
    autoJoin?: boolean

    /**
     * Global commands to register for the room.
     */
    globalCommands?: Commands<U>

    /**
     * Whether to ignore global commands.
     */
    ignoreGlobalCommands?: boolean

    /**
     * Store instance.
     */
    store: Store

    /**
     * Room round.
     */
    round?: Constructor<Round<R>>

    /**
     * Round engine.
     */
    engine?: Engine<R, U>
}

/**
 * Room events.
 */
export interface RoomEventMap<R, U> {
    /**
     * Triggered when the room is closed.
     */
    close: [room: Room<R, U>]
}

/**
 * The Room class is designed to manage and organize game sessions,
 * handling player and spectator limits, and facilitating events within the game room.
 */
export class Room<R, U> extends EventEmitter<RoomEventMap<R, U>> {
    public readonly id = randomUUID()
    public readonly name: string
    public readonly maxPlayers: number
    public readonly allowSpectators: boolean
    public readonly maxSpectators: number
    public readonly autoJoin: boolean
    public readonly pool: Pool<U>
    public readonly commands: Commands<U>
    private readonly _server: BunServer
    private readonly _globalCommands?: Commands<U>
    private readonly _ignoreGlobalCommands: boolean
    private readonly _Round?: Constructor<Round<R>>
    private readonly _state?: RoundState<R, U>
    private readonly _store: Store
    private readonly _engine?: Engine<R, U>
    private _closed = false
    private _listeners = new Map<string, (...args: any[]) => void>()

    /**
     * Creates a new Room instance.
     * @param server The server instance.
     * @param options The options for the room.
     */
    constructor(
        private readonly server: Server<U>,
        options: RoomOptions<R, U>
    ) {
        super()

        this.name = options.name
        this.maxPlayers = options.maxPlayers ?? Infinity
        this.allowSpectators = options.allowSpectators ?? true
        this.maxSpectators = options.maxSpectators ?? Infinity
        this.autoJoin = !!options.autoJoin
        this._server = this.server.getServer()
        this.pool = new Pool<U>(this.name)
        this.commands = new Commands<U>()
        this._globalCommands = options.globalCommands
        this._ignoreGlobalCommands = !!options.ignoreGlobalCommands
        this._Round = options.round
        this._store = options.store
        this._engine = options.engine
        if (this._Round) this._state = new RoundState(this, this._store, this._Round, this._engine)

        this._init()
    }

    private _init() {
        /**
         * Publish a message to the room channel when the room is created.
         */
        this._server.publish(this.name, `Room ${this.name} created`)
        logger.info(`Room ${this.name} created`)

        /**
         * Listen for socket close events.
         */
        const serverCloseListener = this._onPoolSocketClose.bind(this)
        this.server.on('close', serverCloseListener)
        this._listeners.set('close', serverCloseListener)

        /**
         * Listen for incoming messages from the room.
         */
        const serverMessageListener = this._onMessageHandler.bind(this)
        this.server.on('message', serverMessageListener)
        this._listeners.set('message', serverMessageListener)

        /**
         * If auto-join is enabled, listen for incoming connections and join them to the room.
         */
        if (this.autoJoin) {
            logger.info(`Auto join enabled for room ${this.name}, manually joining is disabled`)
            const serverConnectionListener = this._autoJoinHandler.bind(this)
            this.server.on('connection', serverConnectionListener)
            this._listeners.set('connection', serverConnectionListener)
        }
    }

    public get round() {
        if (this._state) return this._state
        else throw new GemoError(`Round is not enabled for room ${this.name}`)
    }

    /**
     * Joins a WebSocket connection to the room.
     * @param ws The WebSocket connection to join.
     */
    public join(ws: ServerWebSocket<U>) {
        if (this.autoJoin) {
            logger.warn('Auto join is enabled, cannot join manually')
            return
        }

        this._join(ws)
    }

    /**
     * Sends data to all participants in the room.
     * @param data The data to send.
     */
    public send(data: Data) {
        this._server.publish(this.name, data)
    }

    private _join(ws: ServerWebSocket<U>) {
        if (ws.data.isAnonymous) {
            if (!this.allowSpectators) {
                ws.close(1000, 'Spectators are not allowed')
                return
            }
            if (this.pool.spectatorsCount >= this.maxSpectators) {
                ws.close(1000, 'Room is full')
                return
            }
        } else if (this.pool.playersCount >= this.maxPlayers) {
            ws.close(1000, 'Room is full')
            return
        }

        logger.info(`${ws.data.isAnonymous ? 'Spectator' : 'Player'} joined the room ${this.name}`)
        this.pool.add(ws)
    }

    private _onMessageHandler(ws: ServerWebSocket<U>, message: string | Buffer) {
        if (!this.commands.execute(ws, message, this)) {
            if (!this._ignoreGlobalCommands) this._globalCommands?.execute(ws, message, this)
        }
    }

    private _autoJoinHandler(ws: ServerWebSocket<U>) {
        if (this.autoJoin) this._join(ws)
    }

    private _onPoolSocketClose(ws: ServerWebSocket<U>) {
        if (this.pool.remove(ws.data.sessionId)) {
            logger.info(`${ws.data.isAnonymous ? 'Spectator' : 'Player'} left the room`)
        }
    }

    /**
     * Closes the room.
     */
    public close() {
        if (this._closed) return
        from(this.pool.entries)
            .pipe(tap(([_, ws]) => ws.close(1001, 'Room closed')))
            .subscribe({
                complete: () => {
                    const closeListener = this._listeners.get('close')
                    if (closeListener) this.server.off('close', closeListener)

                    const messageListener = this._listeners.get('message')
                    if (messageListener) this.server.off('message', messageListener)

                    if (this.autoJoin) {
                        const connectionListener = this._listeners.get('connection')
                        if (connectionListener) this.server.off('connection', connectionListener)
                    }

                    this._engine?.destroy()
                    this._state?.destroy()

                    logger.info(`Room ${this.name} closed`)
                    this.emit('close', this)
                    this._closed = true
                },
            })
    }
}
