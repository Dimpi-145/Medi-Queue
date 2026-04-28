const express = require ('express');
const cookieParser = require ("cookie-parser")
const authRouter = require("./routes/auth.routes")
const appointmentRouter = require("./routes/appointment.routes")
const QueueRouter = require("./routes/queue.routes");
const DashboardRouter = require('./routes/dashboard.routes');
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());



/**
 * POST /api/auth/register
 */
app.use("/api/auth", authRouter)

app.use("/api/appointments", appointmentRouter)

app.use("/api/queue", QueueRouter )

app.use("/api/Dashboard", DashboardRouter )

module.exports = app;