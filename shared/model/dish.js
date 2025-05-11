const mongoose = require("mongoose");

// Dish Schema
const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    image: {
      filePath: String,
      url: String,
    },
    toppingGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ToppingGroup", // Reference the ToppingGroup model
      },
    ],
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dish", dishSchema);
