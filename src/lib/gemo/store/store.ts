export interface Store {
    /**
     * The prefix to use for keys in the store.
     */
    prefix: string

    /**
     * Sets a value in the store.
     * @param key - The key to set.
     * @param value - The value to set.
     */
    set<D = any>(key: string, value: D): D | Promise<D>

    /**
     * Gets a value from the store.
     * @param key - The key to get.
     * @returns The value associated with the key.
     */
    get<D = any>(key: string): (D | undefined) | Promise<D | undefined>

    /**
     * Deletes a value from the store.
     * @param key - The key to delete.
     */
    delete(key: string): boolean | Promise<boolean>
}
