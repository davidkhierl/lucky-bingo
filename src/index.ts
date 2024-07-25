import { Gemo } from '@gemo'
import { createUser } from './services/create-user'

const gemo = Gemo.create({
    server: {
        auth(token) {
            if (token) return createUser()
            else return null
        },
    },
}).listen(3000)

const room = gemo.rooms.create('main', { autoJoin: true })

gemo.server.on('message', (ws, message) => {
    room.send(message)
})
