import type { ServerWebSocket } from './lib/gemo'
import type { BingoCard } from './round/bingo-card'

/**
 * Represents a registered user with an ID and a name.
 */
export interface User {
    /**
     * Unique identifier for the user.
     */
    id: string
    /**
     * Name of the user.
     */
    name: string
}

export interface UserBet {
    ws: ServerWebSocket<User, true>
}

export interface Bet {
    sessionId: string
    user: User
    card: BingoCard
}
