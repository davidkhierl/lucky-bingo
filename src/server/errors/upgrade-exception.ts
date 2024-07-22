import type { UpgradeErrorCode } from '@/server/errors/upgrade-error-code.ts'

export abstract class UpgradeException extends Error {
    public readonly code: number
    protected constructor(message: string, code: UpgradeErrorCode, options?: ErrorOptions) {
        super(message, options)
        this.code = code
    }

    public abstract response(): Response
}
