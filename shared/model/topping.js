const mongoose = require("mongoose");

const toppingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    toppingGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ToppingGroup",
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Topping", toppingSchema);
