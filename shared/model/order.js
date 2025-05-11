const mongoose = require("mongoose");

// Order Schema
var orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerPhonenumber: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    items: [
      {
        dish: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Dish",
        },
        quantity: {
          type: Number,
          required: true,
        },
        toppings: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topping",
          },
        ],
      },
    ],
    shipLocation: {
      type: {
        type: String,
        enum: ["Point"], // GeoJSON type must be "Point"
        default: "Point",
      },
      coordinates: {
        type: [Number], // Array with [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        require: true,
      },
      detailAddress: {
        type: String,
        require: true,
      },
    },
    shipper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipper", // Người giao hàng
    },
    status: {
      type: String,
      enum: [
        "preorder",
        "pending",
        "confirmed",
        "preparing", // Confirm and preparing are the same
        "finished",
        "taken",
        "delivering",
        "delivered",
        "done",
        "cancelled",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit_card"],
    },
    cancelledAt: {
      type: Date,
      default: null,
      index: {
        expireAfterSeconds: 1800, // 30 min
        partialFilterExpression: { status: "cancelled" },
      },
    },
  },
  { timestamps: true }
);

// Create a 2dsphere index to support geospatial queries
orderSchema.index({ shipLocation: "2dsphere" });

module.exports = mongoose.model("Order", orderSchema);
