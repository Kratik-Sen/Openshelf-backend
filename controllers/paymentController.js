import Razorpay from "razorpay";
import crypto from "crypto";
import Pdf from "../models/pdfDetails.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_1234567890",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "test_secret",
});

export const createOrder = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    const book = await Pdf.findById(bookId);
    if (!book) {
      return res.status(404).json({ status: "error", message: "Book not found" });
    }

    // Check if user already paid (convert to string for comparison)
    const userIdStr = String(userId);
    if (book.paidUsers && book.paidUsers.some(id => String(id) === userIdStr)) {
      return res.status(400).json({ status: "error", message: "Already purchased" });
    }

    // Generate a unique receipt ID under 40 characters (Razorpay requirement)
    // Using hash to ensure uniqueness while staying within limit
    const receiptData = `${bookId}_${userId}_${Date.now()}`;
    const receiptHash = crypto.createHash('md5').update(receiptData).digest('hex').substring(0, 32);
    const receipt = `rcpt_${receiptHash}`; // Total: 5 + 32 = 37 characters

    const options = {
      amount: 900, // 9 Rs in paise
      currency: "INR",
      receipt: receipt,
      notes: {
        bookId: bookId,
        userId: userId,
      },
    };

    // Check if Razorpay keys are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || 
        process.env.RAZORPAY_KEY_ID === "your_razorpay_key_id" || 
        process.env.RAZORPAY_KEY_SECRET === "your_razorpay_key_secret") {
      return res.status(500).json({ 
        status: "error", 
        message: "Razorpay keys not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend .env file" 
      });
    }

    const order = await razorpay.orders.create(options);
    res.json({ status: "ok", order });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    const errorMessage = error.error?.description || error.message || "Payment initialization failed";
    res.status(500).json({ 
      status: "error", 
      message: errorMessage,
      details: error.error || error
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookId } = req.body;
    const userId = req.user.id;

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "test_secret")
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ status: "error", message: "Payment verification failed" });
    }

    // Mark user as paid
    const book = await Pdf.findById(bookId);
    if (!book) {
      return res.status(404).json({ status: "error", message: "Book not found" });
    }

    if (!book.paidUsers) {
      book.paidUsers = [];
    }

    const userIdStr = String(userId);
    if (!book.paidUsers.some(id => String(id) === userIdStr)) {
      book.paidUsers.push(userId);
      await book.save();
    }

    res.json({ status: "ok", message: "Payment verified successfully" });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ status: "error", message: "Payment verification failed" });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const book = await Pdf.findById(id);
    if (!book) {
      return res.status(404).json({ status: "error", message: "Book not found" });
    }

    const userIdStr = String(userId);
    const hasPaid = book.paidUsers && book.paidUsers.some(id => String(id) === userIdStr);
    res.json({ status: "ok", hasPaid });
  } catch (error) {
    console.error("Payment status check error:", error);
    res.status(500).json({ status: "error", message: "Failed to check payment status" });
  }
};

