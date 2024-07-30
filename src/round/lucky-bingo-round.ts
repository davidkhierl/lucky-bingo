import { Round, type ConcludePayload, type LockPayload, type ReadyPayload, type TickPayload } from '@/lib/gemo'

export class LuckyBingoRound extends Round<number[]> {
    private numbers: number[] = []
    private drawnNumbers = new Set<number>()

    public async onReady(): Promise<ReadyPayload | undefined> {
        // this.numbers = Array.from({ length: 75 }, (_, i) => i + 1)
        // this.drawnNumbers = new Set<number>()

        // return {
        //     metadata: {
        //         numbers: this.getDrawnNumbers(),
        //     },
        // }
        return
    }
    public onStart(): ReadyPayload | undefined {
        return
    }
    public onLock(): LockPayload | undefined {
        return
    }
    public onConclude(): ConcludePayload<number[]> {
        // const numbers = this.getDrawnNumbers()
        // return {
        //     result: numbers,
        //     metadata: {
        //         total: numbers.length,
        //     },
        // }
        return {
            result: [0],
        }
    }

    public onTick(): TickPayload | undefined {
        // if (this.state === State.Locked && this.timer && this.timer % 2 === 0) this.drawNumber()
        // const numbers = this.getDrawnNumbers()
        // logger.debug(`Total: ${numbers.length} Drawn numbers: ${numbers.join(', ')}`)
        // return {
        //     metadata: {
        //         numbers,
        //         total: numbers.length,
        //     },
        // }
        return
    }

    private drawNumber(): number | undefined {
        if (this.numbers.length === 0) {
            return undefined // No more numbers to draw
        }

        const randomIndex = Math.floor(Math.random() * this.numbers.length)
        const drawnNumber = this.numbers.splice(randomIndex, 1)[0]
        this.drawnNumbers.add(drawnNumber)
        return drawnNumber
    }

    private getDrawnNumbers(): number[] {
        return Array.from(this.drawnNumbers)
    }
}
