import type { ServerWebSocket } from '..'
import { logger } from '../utils/logger'

/**
 * Pool manages a collection of WebSocket connections,
 * allowing for the addition and retrieval of sockets based on their session IDs.
 * It is designed to handle WebSocket connections in a structured manner,
 * ensuring that each socket is subscribed to a specific channel upon addition.
 */
export class Pool<U> {
    private readonly sockets = new Map<string, ServerWebSocket<U>>()

    constructor(public readonly channel: string) {}

    /**
     * Adds a socket to the pool and subscribes to channel.
     * @param ws The socket to add.
     */
    public add(ws: ServerWebSocket<U>) {
        ws.subscribe(this.channel)
        this.sockets.set(ws.data.sessionId, ws)
        logger.info(`Socket ${ws.data.sessionId} added and subscribed to pool ${this.channel}`)
    }

    /**
     * Retrieves a socket from the pool based on the session ID.
     * @param sessionId The session ID of the socket to retrieve.
     * @returns The socket with the specified session ID, or undefined if not found.
     */
    public get(sessionId: string) {
        const ws = this.sockets.get(sessionId)
        if (!ws) {
            console.error(`Could not find socket with sessionId ${sessionId}`)
            return
        }

        return ws
    }

    /**
     * Removes a socket from the pool based on the session ID.
     * @param sessionId The session ID of the socket to remove.
     * @returns True if the socket was successfully removed, false otherwise.
     */
    public remove(sessionId: string) {
        const ws = this.sockets.get(sessionId)
        if (!ws) return false

        ws.unsubscribe(this.channel)
        logger.info(`Socket ${sessionId} removed and unsubscribed from pool ${this.channel}`)
        return this.sockets.delete(sessionId)
    }

    /**
     * Gets an iterator for the sockets in the pool.
     */
    public get entries() {
        return this.sockets.entries()
    }

    /**
     * Executes a callback function for sockets in the pool.
     * @param callback The callback function to execute for each socket.
     */
    public forEach(callback: (ws: ServerWebSocket<U>) => void) {
        this.sockets.forEach(callback)
    }

    /**
     * Gets the total number of sockets in the pool.
     */
    public get size() {
        return this.sockets.size
    }

    /**
     * Get the number of players in the pool.
     */
    public get playersCount() {
        let count = 0
        this.sockets.forEach((ws) => {
            if (!ws.data.isAnonymous) count++
        })
        return count
    }

    /**
     * Get the number of spectators in the pool.
     */
    public get spectatorsCount() {
        let count = 0
        this.sockets.forEach((ws) => {
            if (ws.data.isAnonymous) count++
        })
        return count
    }
}
