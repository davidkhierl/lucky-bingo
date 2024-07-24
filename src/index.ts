import { Server } from '@gemo'
import { createUser } from './services/create-user'

const server = new Server({
    auth(token) {
        if (token) return createUser()
        else return null
    },
})

server.listen()

server.on('userMessage', (ws, message) => {
    console.log('User message', ws.data.user, JSON.parse(typeof message === 'string' ? message : message.toString()))
})

server.on('anonymousMessage', (ws, message) => {
    console.log(
        'Anonymous message',
        ws.data.user,
        JSON.parse(typeof message === 'string' ? message : message.toString())
    )
})
