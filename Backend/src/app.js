const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors");

// ================= ROUTES =================

const authRouter = require("./routes/auth.routes");
const appointmentRouter = require("./routes/appointment.routes");
const queueRouter = require("./routes/queue.routes");
const dashboardRouter = require("./routes/dashboard.routes");
const prescriptionRouter = require("./routes/prescription.routes");
const adminRoutes = require("./routes/admin.routes");
const chatRouter = require("./routes/chat.routes");
const videoRouter = require("./routes/video.routes");
const reportRouter = require("./routes/report.routes");
const doctorRouter = require("./routes/doctor.routes");

// ================= APP =================

const app = express();

// ================= CORS =================

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(",") : []),
]
  .map((origin) => String(origin || "").trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ================= BODY PARSERS =================

app.use(
  express.json({
    limit: "20mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  }),
);

app.use(cookieParser());

// ================= STATIC FILES =================

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ================= HEALTH CHECK =================

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    status: "online",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ================= ROUTES =================

app.use("/api/auth", authRouter);

app.use("/api/appointments", appointmentRouter);

app.use("/api/queue", queueRouter);

app.use("/api/dashboard", dashboardRouter);

app.use("/api/prescriptions", prescriptionRouter);

app.use("/api/reports", reportRouter);

app.use("/api/admin", adminRoutes);

app.use("/api/chat", chatRouter);

app.use("/api/video", videoRouter);

app.use("/api/doctor", doctorRouter);

// Frontend

const frontendDistPath = path.join(__dirname, "..", "..", "Frontend", "dist");
app.use(express.static(frontendDistPath));

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    return next();
  }

  return res.sendFile(path.join(frontendDistPath, "index.html"));
});

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error("[Express Error]", err);

  return res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;
