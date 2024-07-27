import { Commands, Room, type RoomOptions, type Server } from '..'

/**
 * Represents a collection of rooms.
 * @template U - The type of user in the rooms.
 */
export class Rooms<U> {
    private readonly rooms = new Set<Room<U>>()

    /**
     * Creates a new room.
     * @param server - The server instance.
     * @returns The created room.
     */
    constructor(
        private readonly server: Server<U>,
        private readonly commands?: Commands<U>
    ) {}

    /**
     * Creates a new room with the specified name and options.
     * @param name - The name of the room.
     * @param options - The options for the room.
     * @returns The created room.
     */
    public create(name: string, options?: Omit<RoomOptions<U>, 'name' | 'globalCommands'>): Room<U> {
        const room = new Room<U>(this.server, { name, globalCommands: this.commands, ...options })
        room.on('dispose', this.handleOnRoomDispose.bind(this))
        this.rooms.add(room)
        return room
    }

    /**
     * Handles the 'dispose' event of a room.
     * @param room - The room being disposed.
     */
    private handleOnRoomDispose(room: Room<U>) {
        this.rooms.delete(room)
        room.off('dispose', this.handleOnRoomDispose.bind(this))
    }
}
