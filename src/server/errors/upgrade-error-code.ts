export enum UpgradeErrorCode {
    /**
     * The WebSocket upgrade request failed.
     */
    UpgradeFailed = 4000,
    /**
     * The user is unauthorized.
     */
    Unauthorized = 4001,
    /**
     * The token is invalid.
     */
    InvalidToken = 4002,
    /**
     * An unknown errors occurred.
     */
    UnknownError = 4003,
}
