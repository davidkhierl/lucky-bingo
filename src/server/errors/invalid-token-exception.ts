import { UpgradeErrorCode } from '@/server/errors/upgrade-error-code.ts'
import { UpgradeException } from '@/server/errors/upgrade-exception.ts'

export class InvalidTokenException extends UpgradeException {
    constructor(message = 'InvalidToken', options?: ErrorOptions) {
        super(message, UpgradeErrorCode.InvalidToken, options)
    }

    public response() {
        return new Response(JSON.stringify({ message: this.message, code: this.code }), { status: 400 })
    }
}
