const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      require: true,
    },
    lon: {
      type: Number,
      require: true,
    },
    detailAddress: {
      type: String,
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    contactPhonenumber: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["home", "company", "familiar"],
      default: "familiar",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Location", locationSchema);
