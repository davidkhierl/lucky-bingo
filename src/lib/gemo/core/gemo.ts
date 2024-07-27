import { Rooms, Server, type ServerOptions } from '..'
import { logger } from '../utils/logger'

/**
 * Gemo create options.
 */
export interface GemoCreateOptions<U> {
    /**
     * Server options.
     */
    server: ServerOptions<U>
}

/**
 * Represents a Gemo instance.
 * @template U - The type of data used by the Gemo instance.
 */
export class Gemo<U> {
    /**
     * Creates a new Gemo instance.
     * @param server - Gemo server instance.
     * @param rooms - Rooms manager.
     */
    constructor(
        public readonly server: Server<U>,
        public readonly rooms: Rooms<U>
    ) {}

    /**
     * Starts listening for incoming connections on the specified port.
     * @param port - The port number to listen on.
     * @returns The current Gemo instance.
     */
    public listen(port?: number) {
        this.server.listen(port)
        logger.info(`Server listening on port ${port}`)
        return this
    }

    /**
     * Creates a new Gemo instance with the specified options.
     * @param options - The options to configure the Gemo instance.
     * @returns A new Gemo instance.
     */
    public static create<T>(options: GemoCreateOptions<T>) {
        const server = new Server(options.server)
        const rooms = new Rooms(server)
        return new Gemo(server, rooms)
    }
}
