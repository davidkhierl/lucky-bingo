import type { ServerWebSocket as BunServerWebSocket } from 'bun'
import type { ServerWebSocketData, UserWebSocketData } from '../../'

export function isAuthenticatedSocket<U>(
    ws: BunServerWebSocket<ServerWebSocketData<U>>
): ws is BunServerWebSocket<UserWebSocketData<U>> {
    return ws.data.token !== null
}
