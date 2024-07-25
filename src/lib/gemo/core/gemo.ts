import { Rooms, Server, type ServerOptions } from '..'
import { logger } from '../utils/logger'

export interface GemoCreateOptions<U> {
    server: ServerOptions<U>
}

export class Gemo<U> {
    constructor(
        public readonly server: Server<U>,
        public readonly rooms: Rooms<U>
    ) {}

    public listen(port?: number) {
        this.server.listen(port)
        logger.info(`Server listening on port ${port}`)
        return this
    }

    public static create<T>(options: GemoCreateOptions<T>) {
        const server = new Server(options.server)
        const rooms = new Rooms(server)
        return new Gemo(server, rooms)
    }
}
