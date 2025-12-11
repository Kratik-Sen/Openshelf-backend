import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import pdfRoutes from "../routes/pdfRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import paymentRoutes from "../routes/paymentRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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

export default app;

