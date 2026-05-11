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

     // ================= JOIN DOCTOR ROOM =================
    socket.on("joinDoctorRoom", (doctorId) => {

        socket.join(doctorId)

        console.log(
            `Socket ${socket.id} joined doctor room ${doctorId}`
        )
    })

    // ================= LEAVE ROOM =================
    socket.on("leaveDoctorRoom", (doctorId) => {

        socket.leave(doctorId)

        console.log(
            `Socket ${socket.id} left doctor room ${doctorId}`
        )
    })

    // ================= JOIN CONSULTATION ROOM =================
    socket.on("joinConsultationRoom", (roomId) => {
        socket.join(roomId)

        console.log(
            `Socket ${socket.id} joined consultation room ${roomId}`
        )
    })

    socket.on("leaveConsultationRoom", (roomId) => {
        socket.leave(roomId)

        console.log(
            `Socket ${socket.id} left consultation room ${roomId}`
        )
    })

    // ================= DISCONNECT =================
    socket.on("disconnect", () => {

        console.log(
            "Client disconnected:",
            socket.id
        )
    })
})

server.listen(3000, () => {
    console.log(" Server running on port 3000")
})
