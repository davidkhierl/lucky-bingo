import { mergeMap, Subject, tap } from 'rxjs'
import type { Promisable } from 'type-fest'
import { logger } from '..'

export class Bets<B> {
    private readonly _bets = new Set<B>()
    private readonly _queue = new Subject<unknown>()

    constructor(private readonly callback: (bet: unknown) => Promisable<B>) {
        this._queue
            .pipe(
                mergeMap(async (bet) => this.callback(bet)),
                tap({ next: (bet) => logger.debug('Bet placed', bet) })
            )
            .subscribe({
                next: (bet) => this._bets.add(bet),
            })
    }

    public place(bet: unknown) {
        this._queue.next(bet)
    }

    public get placed() {
        return Array.from(this._bets)
    }
}
