const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: String,
    address: {
      full_address: String,
      lat: Number,
      lon: Number,
    },
    storeCategory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodType",
      },
    ],
    avatar: { filePath: String, url: String },
    cover: { filePath: String, url: String },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "BLOCKED"],
      default: "PENDING",
    },
    paperWork: {
      IC_front: { filePath: String, url: String },
      IC_back: { filePath: String, url: String },
      businessLicense: { filePath: String, url: String },
      storePicture: [
        {
          filePath: String,
          url: String,
        },
      ],
    },
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);
