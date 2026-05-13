require("dotenv").config();
const app = require("./src/app");
const connectToDatabase = require("./src/config/database");
const http = require("http");
const { initSockets } = require("./sockets");

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectToDatabase();
    console.log("MongoDB connected successfully");

    initSockets(server, app);

    server.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
})();
