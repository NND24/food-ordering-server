const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel", // 👈 ref động
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["User", "Shipper"], 
    },
    content: {
      type: String,
      trim: true,
    },
    image: {
      filePath: { type: String, required: false },
      url: {
        type: String,
        required: false,
      },
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
