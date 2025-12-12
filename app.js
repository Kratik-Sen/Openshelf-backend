import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import pdfRoutes from "./routes/pdfRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
// import redis from "./config/redis.js"; // Initialize Redis connection

dotenv.config();

const app = express();
app.use(express.json());
const allowedOrigins = [
  "http://localhost:3000",
  "https://openshelf-frontend.vercel.app"
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((e) => console.log("MongoDB connection error:", e.message));

app.get("/", (req, res) => {
  res.send("API is running...");
});
app.use("/", pdfRoutes);
app.use("/", authRoutes);
app.use("/", paymentRoutes);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server Started on port ${PORT}`);
  });

