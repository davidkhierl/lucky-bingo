import { Round, type ConcludePayload, type LockPayload, type ReadyPayload } from '@/lib/gemo'

export class LuckyBingoRound extends Round<number> {
    public async onReady(): Promise<ReadyPayload | undefined> {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        return
    }
    public onStart(): ReadyPayload | undefined {
        return
    }
    public onLock(): LockPayload | undefined {
        return
    }
    public onConclude(): Promise<ConcludePayload<number>> {
        return new Promise((resolve) => setTimeout(() => resolve({ result: Math.ceil(Math.random() * 100) }), 5000))
    }
}
