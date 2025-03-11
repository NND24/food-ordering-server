const mongoose = require("mongoose");

var notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: { type: String, required: true },
    status: {
      type: String,
      required: true,
      default: "unread",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
