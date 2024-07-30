import type { Server as BunServer } from 'bun'
import { randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:stream'
import type { Constructor } from 'type-fest'
import {
    Commands,
    GemoError,
    Pool,
    Round,
    RoundState,
    Server,
    type Data,
    type Engine,
    type ServerWebSocket,
    type Store,
} from '..'
import { logger } from '../utils/logger'

/**
 * Options for creating a Room.
 */
export interface RoomOptions<U> {
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
     * Whether to automatically join players to the room whenever a new connection is established from server.
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
     * Room round.
     */
    round?: Constructor<Round>

    /**
     * Store instance.
     */
    store: Store

    engine?: Engine<U>
}

/**
 * Room events.
 */
export interface RoomEventMap<U> {
    /**
     * Triggered when the room is disposed.
     */
    dispose: [room: Room<U>]
}

/**
 * The Room class is designed to manage and organize game sessions,
 * handling player and spectator limits, and facilitating events within the game room.
 */
export class Room<U> extends EventEmitter<RoomEventMap<U>> {
    public readonly id = randomUUID()
    public readonly name: string
    public readonly maxPlayers: number
    public readonly allowSpectators: boolean
    public readonly maxSpectators: number
    public readonly autoJoin: boolean
    public readonly pool: Pool<U>
    private readonly _server: BunServer
    private readonly globalCommands?: Commands<U>
    private readonly ignoreGlobalCommands: boolean
    public readonly commands: Commands<U>
    private readonly roundConstructor?: Constructor<Round>
    private readonly roundState?: RoundState<U>
    private readonly store: Store

    /**
     * Creates a new Room instance.
     * @param server The server instance.
     * @param options The options for the room.
     */
    constructor(
        private readonly server: Server<U>,
        options: RoomOptions<U>
    ) {
        super()

        this.name = options.name
        this.maxPlayers = options.maxPlayers ?? Infinity
        this.allowSpectators = options.allowSpectators ?? true
        this.maxSpectators = options.maxSpectators ?? Infinity
        this.autoJoin = !!options.autoJoin
        this.globalCommands = options.globalCommands
        this.ignoreGlobalCommands = !!options.ignoreGlobalCommands
        this.commands = new Commands<U>()
        this.roundConstructor = options.round
        this.store = options.store

        if (this.roundConstructor)
            this.roundState = new RoundState(this, this.store, this.roundConstructor, options.engine)

        this._server = this.server.getServer()
        this._server.publish(this.name, `Room ${this.name} created`)

        this.pool = new Pool<U>(this.name)
        this.server.on('close', this.handleOnPoolSocketClose.bind(this))

        logger.info(`Room ${this.name} created`)

        /**
         * Listen for incoming messages from the room.
         */
        this.server.on('message', this.handleOnMessage.bind(this))

        /**
         * If auto join is enabled, listen for incoming connections and join them to the room.
         */
        if (this.autoJoin) {
            logger.info(`Auto join enabled for room ${this.name}, manually joining is disabled`)
            this.server.on('connection', this.handleAutoJoin.bind(this))
        }
    }

    public get round() {
        if (this.roundState) return this.roundState
        else throw new GemoError(`Round is not enabled for room ${this.name}`)
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

    private handleOnMessage(ws: ServerWebSocket<U>, message: string | Buffer) {
        if (!this.commands.execute(ws, message, this)) {
            if (!this.ignoreGlobalCommands) this.globalCommands?.execute(ws, message, this)
        }
    }

    private handleAutoJoin(ws: ServerWebSocket<U>) {
        if (this.autoJoin) this._join(ws)
    }

    private handleOnPoolSocketClose(ws: ServerWebSocket<U>, code: number, reason: string) {
        if (this.pool.remove(ws.data.sessionId)) {
            logger.info(`${ws.data.isAnonymous ? 'Spectator' : 'Player'} left the room`)
        }
    }

    /**
     * Disposes the room and cleans up resources.
     */
    public dispose() {
        this.server.off('message', this.handleOnMessage.bind(this))
        if (this.autoJoin) this.server.off('connection', this.handleAutoJoin.bind(this))

        this.pool.forEach((ws) => ws.close(1001, 'Room disposed'))
        this.server.off('close', this.handleOnPoolSocketClose.bind(this))
        this.emit('dispose', this)
        logger.info(`Room ${this.name} disposed`)
    }
}
