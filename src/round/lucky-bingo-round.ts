import { createMessage, Round, State } from '@/lib/gemo'
import type { Bet, UserBet } from '@/types'
import { BingoCard } from './bingo-card'

export class LuckyBingoRound extends Round<Bet, Bet> {
    private numbers: number[] = []
    private drawnNumbers = new Set<number>()

    public onBet(bet: UserBet) {
        const card = new BingoCard()
        bet.ws.send(createMessage(201, { card: card.card, cardId: card.id }))
        return {
            sessionId: bet.ws.data.sessionId,
            user: bet.ws.data.user,
            card,
        }
    }

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
        const result = this.bets?.placed.find((bet) => bet.card.test(numbers, 'blackout'))
        return {
            result: result ?? null,
            metadata: {
                draw: numbers,
                total: numbers.length,
            },
        }
    }

    public concludeWhen(): boolean {
        return !!this.bets?.placed.some((bet) => bet.card.test(this._getDrawnNumbers(), 'blackout'))
    }

    public onTick() {
        if (this.state === State.Locked && this.timer && this.timer % 2 === 0) this.drawNumber()
        const numbers = this._getDrawnNumbers()
        return {
            metadata: {
                draw: numbers,
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
