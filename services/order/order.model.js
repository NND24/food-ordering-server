const mongoose = require("mongoose");

// Order Schema
var orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    },
    status: {
      type: String,
      enum: ["preorder", "pending", "confirmed", "preparing", "finished", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit_card"],
    },
  },
  { timestamps: true }
);

// Create a 2dsphere index to support geospatial queries
orderSchema.index({ shipLocation: "2dsphere" });

module.exports = {
  Order: mongoose.model("Order", orderSchema),
};
