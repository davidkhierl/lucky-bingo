import { UpgradeErrorCode, UpgradeException } from '../../'

export class UpgradeFailedException extends UpgradeException {
    constructor(message = 'Upgrade failed', options?: ErrorOptions) {
        super(message, UpgradeErrorCode.UpgradeFailed, options)
    }

    public response() {
        return new Response(JSON.stringify({ message: this.message, code: this.code }), { status: 400 })
    }
}
