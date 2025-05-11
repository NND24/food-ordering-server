const mongoose = require("mongoose");

// cart schema

var cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      require: false,
    },
    totalPrice: {
      type: mongoose.Schema.Types.BigInt,
      require: true,
    },
    items: [
      {
        dish: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Dish",
          require: true,
        },
        toppings: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topping",
            require: true,
          },
        ],
        quantity: {
          type: Number,
          require: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = {
  Cart: mongoose.model("Cart", cartSchema),
};
