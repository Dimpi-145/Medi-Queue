const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const authRouter = require("./routes/auth.routes");
const appointmentRouter = require("./routes/appointment.routes");
const QueueRouter = require("./routes/queue.routes");
const DashboardRouter = require("./routes/dashboard.routes");
const prescriptionRouter = require("./routes/prescription.routes");
const adminRoutes = require("./routes/admin.routes");
const chatRouter = require("./routes/chat.routes");
const videoRouter = require("./routes/video.routes");
const cors = require("cors");
const reportRouter = require("./routes/report.routes");
const doctorRouter = require("./routes/doctor.routes");

const app = express();

// Secure CORS configuration
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? (process.env.ALLOWED_ORIGINS || "").split(",")
    : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

/**
 * POST /api/auth/register/login
 */
app.use("/api/auth", authRouter);

app.use("/api/appointments", appointmentRouter);

app.use("/api/queue", QueueRouter);

app.use("/api/Dashboard", DashboardRouter);

app.use("/api/prescriptions", prescriptionRouter);

app.use("/api/reports", reportRouter);

app.use("/api/admin", adminRoutes);

app.use("/api/chat", chatRouter);

app.use("/api/video", videoRouter);

app.use("/api/doctor", doctorRouter);

module.exports = app;
