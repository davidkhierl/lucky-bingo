import { UpgradeErrorCode, UpgradeException } from '../../'

export class InvalidTokenException extends UpgradeException {
    constructor(message = 'InvalidToken', options?: ErrorOptions) {
        super(message, UpgradeErrorCode.InvalidToken, options)
    }

    public response() {
        return new Response(JSON.stringify({ message: this.message, code: this.code }), { status: 400 })
    }
}
