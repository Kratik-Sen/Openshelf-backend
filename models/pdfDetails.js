import mongoose from "mongoose";

const PdfDetailsSchema = new mongoose.Schema(
  {
    title: String,
    pdf: String,
    coverImage: String,
    category: String, // ➕ Added category
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paidUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Track users who paid
  },
  { collection: "PdfDetails" }
);

export default mongoose.model("PdfDetails", PdfDetailsSchema);
