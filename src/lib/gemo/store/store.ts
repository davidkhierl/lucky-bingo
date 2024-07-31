import { kebabCase } from 'lodash'
import { nanoid } from 'nanoid'

export abstract class Store {
    /**
     * Store prefix.
     */
    public readonly prefix: string

    protected constructor(prefix?: string) {
        this.prefix = prefix ? kebabCase(prefix) : nanoid()
    }

    /**
     * Decreases the value of the specified key by 1 and returns the new value.
     *
     * @param {string} key - The key to decrement.
     * @returns {Promise<number>} - A Promise that resolves with the new value after decrementing, or rejects with an error.
     */
    abstract decr(key: string): Promise<number>

    /**
     * Deletes a value from the store.
     * @param key - The key to delete.
     * @returns True if the key was deleted, otherwise false.
     */
    abstract delete(key: string): Promise<string | null>

    /**
     * Gets a value from the store.
     * @param key - The key to get.
     * @returns The value if it exists, is otherwise undefined
     */
    abstract get(key: string): Promise<string | null>

    /**
     * Increases the value of the specified key by 1 and returns the new value.
     *
     * @param {string} key - The key to increment.
     * @returns {Promise<number>} - A Promise that resolves with the new value after incrementing, or rejects with an error.
     */
    abstract incr(key: string): Promise<number>

    /**
     * Sets a value in the store.
     * @param key - The key to set.
     * @param value - The value to set.
     * @returns The value that was set.
     */
    abstract set(key: string, value: string): Promise<string>

    /**
     * Constructs a key using a provided string.
     *
     * @param {string} key - The string to construct the key with.
     * @return {string} The constructed key.
     */
    protected keyConstructor(key: string): string {
        return `gemo:${this.prefix}:${key}`
    }
}
