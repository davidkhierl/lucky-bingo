import BingoServer from '@/server/bingo-server.ts'
import UserManager from '@/user-manager.ts'

const userManager = new UserManager()

const server = new BingoServer((token) => (token ? userManager.createUser() : userManager.createAnonymousUser()))

server.start()

server.on('connection', (ws) => {
    console.log('Client connected', ws.data)
})
