import { Round, State } from '@/lib/gemo'

export class LuckyBingoRound extends Round<number[]> {
    private numbers: number[] = []
    private drawnNumbers = new Set<number>()

    public onReady() {
        this.numbers = Array.from({ length: 75 }, (_, i) => i + 1)
        this.drawnNumbers = new Set<number>()

        return {
            metadata: {
                numbers: this._getDrawnNumbers(),
            },
        }
    }

    public onConclude() {
        const numbers = this._getDrawnNumbers()
        return {
            result: numbers,
            metadata: {
                total: numbers.length,
            },
        }
    }

    public onTick() {
        if (this.state === State.Locked && this.timer && this.timer % 2 === 0) this.drawNumber()
        const numbers = this._getDrawnNumbers()
        return {
            metadata: {
                numbers,
                total: numbers.length,
            },
        }
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

    private _getDrawnNumbers(): number[] {
        return Array.from(this.drawnNumbers)
    }
}
