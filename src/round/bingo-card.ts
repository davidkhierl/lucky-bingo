import { nanoid } from 'nanoid'

export type BingoCardCondition = 'any' | 'diagonal' | 'horizontal' | 'vertical' | 'blackout'

export class BingoCard {
    public readonly id: string
    public readonly card: (number | string)[][]

    constructor() {
        this.id = nanoid()
        this.card = this.generateCard()
    }

    private generateRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    private generateColumn(min: number, max: number, count: number): number[] {
        const column = new Set<number>()
        while (column.size < count) {
            column.add(this.generateRandomNumber(min, max))
        }
        return Array.from(column)
    }

    private generateCard(): (number | string)[][] {
        const card: (number | string)[][] = []
        const ranges = [
            { min: 1, max: 15 },
            { min: 16, max: 30 },
            { min: 31, max: 45 },
            { min: 46, max: 60 },
            { min: 61, max: 75 },
        ]

        for (let i = 0; i < 5; i++) {
            card[i] = this.generateColumn(ranges[i].min, ranges[i].max, 5)
        }

        // Set the center space as a free space
        card[2][2] = 'FREE'

        return card
    }

    public test(drawnNumbers: number[], condition: BingoCardCondition = 'any'): boolean {
        const isNumberDrawn = (num: number | string) => num === 'FREE' || drawnNumbers.includes(num as number)

        const checkCondition = (arr: (number | string)[]) => arr.every(isNumberDrawn)

        switch (condition) {
            case 'any':
                return this.card.flat().some(isNumberDrawn)

            case 'diagonal':
                const diagonal1 = this.card.map((row, idx) => row[idx])
                const diagonal2 = this.card.map((row, idx) => row[4 - idx])
                return checkCondition(diagonal1) || checkCondition(diagonal2)

            case 'horizontal':
                return this.card.some((row) => checkCondition(row))

            case 'vertical':
                for (let col = 0; col < 5; col++) {
                    const column = this.card.map((row) => row[col])
                    if (checkCondition(column)) return true
                }
                return false

            case 'blackout':
                return this.card.flat().every(isNumberDrawn)

            default:
                return false
        }
    }

    public printCard() {
        return this.card.map((row) => row.join('\t')).join('\n')
    }
}
