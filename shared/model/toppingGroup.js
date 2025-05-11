const mongoose = require("mongoose");

const toppingGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    onlyOnce: {
      type: Boolean,
      default: false,
    },
    toppings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topping",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ToppingGroup", toppingGroupSchema);
