import type { Constructor } from 'type-fest'
import { Command, Commands, InMemoryStore, Rooms, Server, type ServerOptions, type Store } from '..'
import { logger } from '../utils/logger'

/**
 * Gemo create options.
 */
export interface GemoCreateOptions<U, C extends U> {
    /**
     * Server options.
     */
    server: ServerOptions<U>

    /**
     * Commands to register.
     */
    commands?: { code: number; commands: Constructor<Command<C>>[] }[]

    /**
     * Store instance.
     */
    store?: Store
}

/**
 * Represents a Gemo instance.
 * @template U - The type of data used by the Gemo instance.
 */
export class Gemo<U> {
    /**
     * Creates a new instance of Gemo.
     *
     * @param {string} name - The name of the Gemo instance.
     * @param {Server<U>} server - The server instance.
     * @param {Rooms<U>} rooms - The room instance.
     * @param {Commands<U>} commands - The commands instance.
     * @param {Store} store - The store instance.
     */
    constructor(
        public readonly name: string,
        public readonly server: Server<U>,
        public readonly rooms: Rooms<U>,
        public readonly commands: Commands<U>,
        public readonly store: Store
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
     * Creates a new instance of Gemo.
     *
     * @param {string} name - The name of the Gemo instance.
     * @param {GemoCreateOptions} options - The options for configuring the Gemo instance.
     */
    public static create<T, C extends T>(name: string, options: GemoCreateOptions<T, C>) {
        const store = options.store ?? new InMemoryStore(name)
        const server = new Server(options.server)
        const commands = new Commands<C>()
        options.commands?.forEach((command) => commands.add(command.code, ...command.commands))
        const rooms = new Rooms(server, store, commands)
        return new Gemo(name, server, rooms, commands, store)
    }
}
