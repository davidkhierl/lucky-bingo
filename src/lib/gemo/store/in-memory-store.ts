import { Store } from './store'

export class InMemoryStore extends Store {
    private store: Map<string, string | number> = new Map()

    constructor(prefix: string) {
        super(prefix)
    }

    decr(key: string): Promise<number> {
        let value = this.store.get(this.keyConstructor(key))
        if (!value) throw new Error('Value is not defined')
        else if (typeof value !== 'number' || isNaN(value)) throw new Error('Value is not a number')
        --value
        this.store.set(this.keyConstructor(key), value)
        return new Promise((resolve) => resolve(value))
    }

    public delete(key: string): Promise<string | null> {
        let _value: string | null = null
        const value = this.store.get(this.keyConstructor(key))
        if (value && typeof value === 'number') _value = value.toString()
        const del = this.store.delete(this.keyConstructor(key))
        if (!del) _value = null
        return new Promise((resolve) => resolve(_value))
    }

    public get(key: string): Promise<string | null> {
        let _value: string | null = null
        let value = this.store.get(this.keyConstructor(key))
        if (value && typeof value === 'number') _value = value.toString()
        return new Promise((resolve) => resolve(_value))
    }

    incr(key: string): Promise<number> {
        let value = this.store.get(this.keyConstructor(key))
        if (!value) {
            value = 1
            this.store.set(this.keyConstructor(key), value)
        } else if (typeof value !== 'number') throw new Error('Value is not a number')
        ++value
        this.store.set(this.keyConstructor(key), value)
        return new Promise((resolve) => resolve(value))
    }

    public set(key: string, value: string): Promise<string> {
        this.store.set(this.keyConstructor(key), value)
        return new Promise((resolve) => resolve(value))
    }
}
