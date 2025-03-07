const mongoose = require("mongoose");

// Dish Schema
var dishSchema = new mongoose.Schema(
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

// Store Schema
var storeSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

// Topping Group Schema
var toppingGroupSchema = new mongoose.Schema(
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
    toppings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topping",
      },
    ],
  },
  { timestamps: true }
);

// Topping Schema
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

// Staff Schema
var staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["manager", "staff"],
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    contact: {
      phone: String,
      email: String,
    },
  },
  { timestamps: true }
);

var ratingSchema = new mongoose.Schema(
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
    ratingValue: {
      type: Number,
      required: true,
      min: 1,
      max: 5, // 1-5 star rating system
    },
    comment: {
      type: String,
      default: "", // Empty string if no comment
    },
    images: [
      {
        filePath: String,
        url: String,
      },
    ],
  },
  { timestamps: true }
);

var categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  dishes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Dish" }],
});

// Method to calculate average rating for a dish
ratingSchema.statics.getAverageRating = async function (dishId) {
  const result = await this.aggregate([
    { $match: { dish: dishId } },
    { $group: { _id: "$dish", avgRating: { $avg: "$ratingValue" }, count: { $sum: 1 } } },
  ]);
  return result.length > 0 ? result[0] : { avgRating: 0, count: 0 };
};

// Method to calculate average rating for a store
ratingSchema.statics.getStoreRatingSummary = async function (storeId) {
  const result = await this.aggregate([
    { $match: { store: storeId } },
    { $group: { _id: "$store", avgRating: { $avg: "$ratingValue" }, count: { $sum: 1 } } },
  ]);
  return result.length > 0 ? result[0] : { avgRating: 0, count: 0 };
};

module.exports = {
  Dish: mongoose.model("Dish", dishSchema),
  Store: mongoose.model("Store", storeSchema),
  Topping: mongoose.model("Topping", toppingSchema),
  ToppingGroup: mongoose.model("ToppingGroup", toppingGroupSchema),
  Staff: mongoose.model("Staff", staffSchema),
  Rating: mongoose.model("Rating", ratingSchema),
  Category: mongoose.model("Category", categorySchema),
};
