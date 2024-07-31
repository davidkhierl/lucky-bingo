import { Redis } from 'ioredis'
import { Store } from '..'

export class RedisStore extends Store {
    constructor(
        private readonly redis: Redis,
        prefix: string
    ) {
        super(prefix)
    }

    decr(key: string): Promise<number> {
        return this.redis.decr(this.keyConstructor(key))
    }

    async delete(key: string): Promise<string | null> {
        return this.redis.getdel(this.keyConstructor(key))
    }

    get(key: string): Promise<string | null> {
        return this.redis.get(this.keyConstructor(key))
    }

    incr(key: string): Promise<number> {
        return this.redis.incr(this.keyConstructor(key))
    }

    async set(key: string, value: string): Promise<string> {
        const set = await this.redis.set(this.keyConstructor(key), value)
        if (set !== 'OK') throw new Error('Failed to set value')
        return value
    }
}
