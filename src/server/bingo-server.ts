import { InvalidTokenException } from '@/server/errors/invalid-token-exception.ts'
import { UnauthorizedException } from '@/server/errors/unauthorized-exception.ts'
import { UnknownErrorException } from '@/server/errors/unknown-error-exception.ts'
import { UpgradeErrorCode } from '@/server/errors/upgrade-error-code.ts'
import { UpgradeException } from '@/server/errors/upgrade-exception.ts'
import { UpgradeFailedException } from '@/server/errors/upgrade-failed-exception.ts'
import type { AnonymousUser, User } from '@/types.ts'
import type { Server, ServerWebSocket } from 'bun'
import { randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:events'

/**
 * Interface representing the basic structure of WebSocket data.
 */
export interface WebSocketData {
    /**
     * Unique identifier for the WebSocket connection.
     */
    id: string
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
    user: User | AnonymousUser
}

/**
 * Interface extending WebSocketData for authenticated users.
 */
export interface UserWebSocketData extends WebSocketData {
    /**
     * Authentication token (non-null for authenticated users).
     */
    token: string
    /**
     * Detailed user information for authenticated users.
     */
    user: User
}

/**
 * Interface extending WebSocketData for anonymous users.
 */
export interface AnonymousUserWebSocketData extends WebSocketData {
    /**
     * Token is explicitly null for anonymous users.
     */
    token: null
    /**
     *  Basic user information for anonymous users.
     */
    user: AnonymousUser
}

/**
 * Union type for WebSocket data that can either belong to an authenticated user or an anonymous user.
 */
export type BingoWebSocketData = UserWebSocketData | AnonymousUserWebSocketData

/**
 * Type definition for a WebSocket connection in the BingoServer context, incorporating custom data.
 */
export type BingoServerWebSocket = ServerWebSocket<BingoWebSocketData>

/**
 * Interface defining the event map for the BingoServer, specifying the types of events and their payloads.
 */
export interface BingoServerEventMap {
    /**
     * Event triggered on a new WebSocket connection.
     */
    connection: [ws: BingoServerWebSocket]
    /**
     * Event triggered on WebSocket disconnection.
     */
    close: [ws: BingoServerWebSocket, code: number, reason: string]
    /**
     * Event triggered on receiving a message from the WebSocket.
     */
    message: [ws: BingoServerWebSocket, message: string | Buffer]
    /**
     * Event triggered when the WebSocket is ready to send more data after being previously saturated.
     */
    drain: [ws: BingoServerWebSocket]
}

/**
 * A function to be call to create a user or an anonymous user
 * during an upgrade process.
 *
 * @param token - The token associated with the user.
 * @returns The created user or anonymous user.
 */
export type OnUpgradeFn = (token: string | null) => Promise<User | AnonymousUser> | User | AnonymousUser

/**
 * Bingo game server, capable of handling WebSocket connections for bingo games.
 */
export default class BingoServer extends EventEmitter<BingoServerEventMap> {
    private readonly exceptionFilters = new Map<number, UpgradeException>()

    /**
     * BingoServer class.
     * @constructor
     * @param {OnUpgradeFn} onUpgrade - The function to be called on upgrade to create a user.
     */
    constructor(private readonly onUpgrade: OnUpgradeFn) {
        super()

        // add default exception filters
        this.useExceptionFilter(
            new InvalidTokenException(),
            new UnauthorizedException(),
            new UnknownErrorException(),
            new UpgradeFailedException()
        )
    }

    /**
     * Starts the BingoServer on the specified port, setting up WebSocket connections and handling events.
     * @param port The port number on which the server should listen to. Defaults to 3000.
     * @returns The server instance for chaining.
     */
    public start(port = 3000) {
        return Bun.serve<BingoWebSocketData>({
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
        })
    }

    /**
     * Handles the upgrade request.
     *
     * @param req - The request object.
     * @param server - The server object.
     * @returns The response object if the upgrade request is successful, otherwise undefined.
     */
    private async handleUpgradeRequest(req: Request, server: Server): Promise<Response | undefined> {
        try {
            const token = this.parseTokenFromUrl(req.url)
            const user = await this.onUpgrade(token)

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
     * Parses the token from the given URL.
     * @param url - The URL to parse the token from.
     * @returns The token parsed from the URL, or null if no token is found.
     */
    private parseTokenFromUrl(url: string): string | null {
        return new URL(url).searchParams.get('token')
    }

    /**
     * Attempts to upgrade the server with the provided request, token, and user.
     * @param req - The request object.
     * @param server - Bun server.
     * @param token - The token string or null.
     * @param user - The user object.
     * @returns A boolean indicating whether the upgrade was successful.
     */
    private attemptUpgrade(req: Request, server: Server, token: string | null, user: User | AnonymousUser): boolean {
        return server.upgrade(req, {
            data: {
                id: randomUUID(),
                token,
                createdAt: new Date(),
                user,
            },
        })
    }

    /**
     * Handles the failure of an upgrade request.
     * @returns A Response object with a status code of 500 and a message indicating the upgrade failure.
     */
    private fallbackUpgradeErrorException(): Response {
        const exception = this.exceptionFilters.get(UpgradeErrorCode.UpgradeFailed)
        if (exception) {
            return exception.response()
        }
        return new Response('Upgrade failed', { status: 500 })
    }

    public useExceptionFilter(...exceptions: UpgradeException[]) {
        exceptions.forEach((exception) => {
            this.exceptionFilters.set(exception.code, exception)
        })
    }
}
