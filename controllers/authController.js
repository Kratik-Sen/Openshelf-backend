import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Use a fallback secret in development so auth routes don't crash when JWT_SECRET is missing.
// In production you should always set process.env.JWT_SECRET explicitly.
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ status: "error", message: "Email already used" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ status: "ok", token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Signup failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ status: "error", message: "wrong email or password"});
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ status: "error", message: "wrong email or password"});
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ status: "ok", token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Login failed" });
  }
};
