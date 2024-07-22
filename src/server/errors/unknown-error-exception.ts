import { UpgradeErrorCode } from '@/server/errors/upgrade-error-code.ts'
import { UpgradeException } from '@/server/errors/upgrade-exception.ts'

export class UnknownErrorException extends UpgradeException {
    constructor(message = 'Unknown error', options?: ErrorOptions) {
        super(message, UpgradeErrorCode.UnknownError, options)
    }

    public response() {
        return new Response(JSON.stringify({ message: this.message, code: this.code }), { status: 500 })
    }
}
