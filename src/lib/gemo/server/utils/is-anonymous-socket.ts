import type { ServerWebSocket as BunServerWebSocket } from 'bun'
import type { AnonymousWebSocketData, ServerWebSocketData } from '../../'

export function isAnonymousSocket<U>(
    ws: BunServerWebSocket<ServerWebSocketData<U>>
): ws is BunServerWebSocket<AnonymousWebSocketData> {
    return ws.data.token === null
}
