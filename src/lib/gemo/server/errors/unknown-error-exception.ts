import { UpgradeErrorCode, UpgradeException } from '../../'

export class UnknownErrorException extends UpgradeException {
    constructor(message = 'Unknown error', options?: ErrorOptions) {
        super(message, UpgradeErrorCode.UnknownError, options)
    }

    public response() {
        return new Response(JSON.stringify({ message: this.message, code: this.code }), { status: 500 })
    }
}
