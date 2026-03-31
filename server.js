const express      = require("express");
const dotenv       = require("dotenv");
const { initDB }   = require("./config/db");
const { connectRedis } = require("./config/redis");
const authRoutes   = require("./routes/authRoutes");

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (_req, res) => res.json({ message: "Auth API running 🚀" }));
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));

const start = async () => {
  await initDB();
  await connectRedis();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

start();