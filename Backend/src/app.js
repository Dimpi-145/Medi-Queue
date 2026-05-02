const express = require ('express');
const cookieParser = require ("cookie-parser")
const authRouter = require("./routes/auth.routes")
const appointmentRouter = require("./routes/appointment.routes")
const QueueRouter = require("./routes/queue.routes");
const DashboardRouter = require('./routes/dashboard.routes');
const prescriptionRouter = require("./routes/prescription.routes");
const cors = require("cors");
const reportRouter = require("./routes/report.routes");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


/**
 * POST /api/auth/register/login
 */
app.use("/api/auth", authRouter)


app.use("/api/appointments", appointmentRouter)

app.use("/api/queue", QueueRouter )

app.use("/api/Dashboard", DashboardRouter )

app.use("/api/prescriptions", prescriptionRouter);

app.use("/api/reports", reportRouter);

module.exports = app;