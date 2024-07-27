import { kebabCase } from 'lodash'
import type { Store } from './store'

export class InMemoryStore implements Store {
    public readonly prefix: string
    private store: Map<string, any> = new Map()

    constructor(prefix: string) {
        this.prefix = kebabCase(prefix)
    }

    public set<D = any>(key: string, value: D): D | Promise<D> {
        this.store.set(this.keyConstructor(key), value)
        return value
    }

    public get<D = any>(key: string): (D | undefined) | Promise<D | undefined> {
        return this.store.get(this.keyConstructor(key))
    }

    public delete(key: string): boolean | Promise<boolean> {
        return this.store.delete(this.keyConstructor(key))
    }

    private keyConstructor(key: string) {
        return `${this.prefix}:${key}`
    }
}
