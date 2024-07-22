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

/**
 * Represents an anonymous user with only an ID.
 */
export interface AnonymousUser {
    /**
     * Unique identifier for the anonymous user.
     */
    id: string
}
