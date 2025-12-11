import express from "express";
import { createOrder, verifyPayment, checkPaymentStatus } from "../controllers/paymentController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/payment/create-order", auth, createOrder);
router.post("/payment/verify", auth, verifyPayment);
router.get("/payment/status/:id", auth, checkPaymentStatus);

export default router;

