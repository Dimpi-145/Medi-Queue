require('dotenv').config()
const app = require("./src/app")
const connectToDatabase = require ("./src/config/database")
const http = require("http")
const { Server } = require("socket.io")

const server = http.createServer(app)


connectToDatabase()


const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

// make io available globally
app.set("io", io)

io.on("connection", (socket) => {
    console.log(" Client connected:", socket.id)

    socket.on("disconnect", () => {
        console.log(" Client disconnected:", socket.id)
    })
})

server.listen(3000, () => {
    console.log(" Server running on port 3000")
})
