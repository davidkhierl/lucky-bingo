import { UpgradeErrorCode, UpgradeException } from '../../'

export class UnauthorizedException extends UpgradeException {
    constructor(message = 'Unauthorized', options?: ErrorOptions) {
        super(message, UpgradeErrorCode.Unauthorized, options)
    }

    public response() {
        return new Response(JSON.stringify({ message: this.message, code: this.code }), { status: 401 })
    }
}
