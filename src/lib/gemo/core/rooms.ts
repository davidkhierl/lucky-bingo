import { Commands, Room, type RoomOptions, Server, Store } from '..'

/**
 * Represents a collection of rooms.
 * @template U - The type of user in the rooms.
 */
export class Rooms<U> {
    private readonly rooms = new Map<string, Room<U>>()
    private readonly _listeners = new Map<string, (...args: any[]) => void>()

    /**
     * Creates a new instance of Rooms.
     *
     * @param server - The server instance.
     * @param store - The store instance.
     * @param commands - Room commands.
     */
    constructor(
        private readonly server: Server<U>,
        private readonly store: Store,
        private readonly commands?: Commands<U>
    ) {}

    /**
     * Creates a new room with the specified name and options.
     * @param name - The name of the room.
     * @param options - The options for the room.
     * @returns The created room.
     */
    public create(name: string, options?: Omit<RoomOptions<U>, 'name' | 'globalCommands' | 'store'>): Room<U> {
        if (this.rooms.has(name)) throw new Error(`Room ${name} already exists`)

        const room = new Room<U>(this.server, { name, globalCommands: this.commands, store: this.store, ...options })

        const roomCloseListener = this.onRoomCloseHandler.bind(this)
        this._listeners.set(room.name, roomCloseListener)
        room.on('close', roomCloseListener)

        this.rooms.set(room.name, room)

        return room
    }

    /**
     * Retrieves the list of rooms.
     *
     * @return {Array} The list of rooms as an array.
     */
    public get list(): Room<U>[] {
        return Array.from(this.rooms.values())
    }

    /**
     * Handles the 'close' event for a room.
     * Removes the room from the collection and unbinds the event listener.
     *
     * @param room The room to handle the 'close' event for.
     */
    private onRoomCloseHandler(room: Room<U>) {
        const roomCloseListener = this._listeners.get(room.name)
        if (roomCloseListener) {
            room.off('close', roomCloseListener)
            this._listeners.delete(room.name)
            this.rooms.delete(room.name)
        }
    }
}
