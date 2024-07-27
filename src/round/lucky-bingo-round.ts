import { Round, type OnConclude, type OnLock, type OnReady, type OnStart } from '@/lib/gemo'

export class LuckyBingoRound extends Round {
    public onReady(): OnReady {
        return
    }
    public onStart(): OnStart {
        return
    }
    public onLock(): OnLock {
        return
    }
    public onConclude(): OnConclude {
        return { result: Math.ceil(Math.random() * 100) }
    }
}
