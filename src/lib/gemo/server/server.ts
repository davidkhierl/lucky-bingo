import type { Server as BunServer, ServerWebSocket as BunServerWebSocket } from 'bun'
import { nanoid } from 'nanoid'
import { randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:events'
import type { Constructor } from 'type-fest'
import {
    InvalidTokenException,
    UnauthorizedException,
    UnknownErrorException,
    UpgradeErrorCode,
    UpgradeException,
    UpgradeFailedException,
} from '../'

/**
 * Anonymous user connected to the server.
 */
export interface Anonymous {
    /**
     * Unique identifier for the anonymous user.
     */
    id: string
}

/**
 * WebSocket data associated with a connection.
 */
export interface WebSocketData<U> {
    /**
     * Unique session ID for the WebSocket connection.
     */
    sessionId: string

    /**
     * Authentication token, if any. Null for anonymous users.
     */
    token: string | null

    /**
     * Timestamp of when the WebSocket connection was established.
     */
    createdAt: Date

    /**
     * User information associated with the WebSocket connection.
     */
    user: U

    /**
     * Whether the user is anonymous.
     */
    isAnonymous: boolean
}

/**
 * Interface extending WebSocketData for authenticated users.
 */
export interface UserWebSocketData<U> extends WebSocketData<U> {
    /**
     * Authentication token (non-null for authenticated users).
     */
    token: string

    /**
     * Whether the user is anonymous (always false for authenticated users).
     */
    isAnonymous: false
}

/**
 * Interface extending WebSocketData for anonymous users.
 */
export interface AnonymousWebSocketData extends WebSocketData<Anonymous> {
    /**
     * Token is explicitly null for anonymous users.
     */
    token: null

    /**
     * Whether the user is anonymous (always true for anonymous users).
     */
    isAnonymous: true
}

/**
 * Union type for WebSocket data that can either belong to an authenticated user or an anonymous user.
 */
export type ServerWebSocketData<U> = UserWebSocketData<U> | AnonymousWebSocketData

/**
 * Type definition for a WebSocket connection in the Server context, incorporating custom data.
 */
export type ServerWebSocket<U> = BunServerWebSocket<ServerWebSocketData<U>>

/**
 * Interface defining the event map for the Server, specifying the types of events and their payloads.
 */
export interface ServerEventMap<U> {
    /**
     * Event triggered on a new WebSocket connection.
     */
    connection: [ws: ServerWebSocket<U>]

    /**
     * Event triggered on WebSocket disconnection.
     */
    close: [ws: ServerWebSocket<U>, code: number, reason: string]

    /**
     * Event triggered on receiving a message from the WebSocket.
     */
    message: [ws: ServerWebSocket<U>, message: string | Buffer]

    /**
     * Event triggered when the WebSocket is ready to send more data after being previously saturated.
     */
    drain: [ws: ServerWebSocket<U>]
}

/**
 * Options for configuring the Server instance.
 */
export interface ServerOptions<U> {
    /**
     * Function to authenticate a user based on the provided token.
     * @param token - The token string or null.
     * @returns The user object if authentication is successful, otherwise null.
     */
    auth?: (token: string | null) => U | null | Promise<U | null>

    /**
     * Whether to allow anonymous users to connect to the server.
     */
    allowAnonymous?: boolean
}

/**
 * Server class for handling WebSocket connections.
 */
export class Server<U = never> extends EventEmitter<ServerEventMap<U>> {
    private readonly exceptionFilters = new Map<number, UpgradeException>()
    private readonly allowAnonymous: boolean
    private readonly auth: ((token: string | null) => U | null | Promise<U | null>) | undefined
    private server?: BunServer

    /**
     * Creates a new Server instance with the specified options.
     * @param options - The options to configure the server.
     */
    constructor(options?: ServerOptions<U>) {
        super()

        this.allowAnonymous = options?.allowAnonymous ?? true
        this.auth = options?.auth

        // Register default exception filters
        this.useExceptionFilter(
            InvalidTokenException,
            UnauthorizedException,
            UnknownErrorException,
            UpgradeFailedException
        )
    }

    /**
     * Starts the server and listens on the specified port.
     * @param port - The port number to listen on.
     * @returns The server instance.
     */
    public listen(port = 3000) {
        return (this.server = Bun.serve<ServerWebSocketData<U>>({
            port,
            fetch: this.handleUpgradeRequest.bind(this),
            websocket: {
                open: (ws) => {
                    this.emit('connection', ws)
                },
                close: (ws, code, reason) => {
                    this.emit('close', ws, code, reason)
                },
                message: (ws, message) => {
                    this.emit('message', ws, message)
                },
                drain: (ws) => {
                    this.emit('drain', ws)
                },
            },
        }))
    }

    /**
     * Handles the upgrade request.
     *
     * @param req - The request object.
     * @param server - The server object.
     * @returns The response object if the upgrade request is successful, otherwise undefined.
     */
    private async handleUpgradeRequest(req: Request, server: BunServer): Promise<Response | undefined> {
        try {
            if (!this.auth && !this.allowAnonymous) return this.fallbackUpgradeErrorException()

            const token = this.parseTokenFromUrl(req.url)

            let user: U | null = null
            if (this.auth) user = await this.auth(token)

            if (!this.attemptUpgrade(req, server, token, user)) {
                return this.fallbackUpgradeErrorException()
            }
        } catch (error) {
            if (error instanceof UpgradeException) {
                return this.exceptionFilters.get(error.code)?.response()
            } else return this.fallbackUpgradeErrorException()
        }
    }

    /**
     * Gets the Bun server instance.
     * @returns The Bun server instance.
     */
    public getServer(): BunServer {
        if (!this.server) throw new Error('Server is not started')
        return this.server
    }

    /**
     * Parses the token from the given URL.
     * @param url - The URL to parse the token from.
     * @returns The token parsed from the URL, or null if no token is found.
     */
    private parseTokenFromUrl(url: string): string | null {
        return new URL(url).searchParams.get('token')
    }

    /**
     * Attempts to upgrade the request to a WebSocket connection.
     * @param req - The request object.
     * @param server - The server object.
     * @param token - The authentication token.
     * @param user - The user object.
     * @returns True if the upgrade is successful, otherwise false.
     */
    private attemptUpgrade(req: Request, server: BunServer, token: string | null, user: U | null): boolean {
        const data = {
            sessionId: nanoid(),
            token,
            createdAt: new Date(),
            user: user ?? { id: randomUUID() },
            isAnonymous: user === null,
        } satisfies WebSocketData<U | Anonymous>

        return server.upgrade(req, {
            data,
        })
    }

    /**
     * Handles the failure of an upgrade request.
     * @returns A Response object with a status code of 500 and a message indicating the upgrade failure.
     */
    private fallbackUpgradeErrorException(): Response {
        const exception = this.exceptionFilters.get(UpgradeErrorCode.UpgradeFailed)
        if (exception) return exception.response()

        return new Response('Upgrade failed', { status: 500 })
    }

    /**
     * Registers the specified exceptions to be used as filters for handling upgrade errors.
     * @param exceptions - The exception constructors to register.
     */
    public useExceptionFilter(...exceptions: Constructor<UpgradeException>[]) {
        exceptions
            .map((ctor) => new ctor())
            .forEach((exception) => {
                this.exceptionFilters.set(exception.code, exception)
            })
    }
}
