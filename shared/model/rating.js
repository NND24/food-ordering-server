const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
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
    dishes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Dish",
      },
    ],
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

ratingSchema.statics.getAverageRating = async function (dishId) {
  const result = await this.aggregate([
    { $match: { dish: dishId } },
    {
      $group: {
        _id: "$dish",
        avgRating: { $avg: "$ratingValue" },
        count: { $sum: 1 },
      },
    },
  ]);
  return result.length > 0 ? result[0] : { avgRating: 0, count: 0 };
};
ratingSchema.statics.getStoreRatingSummary = async function (storeId) {
  const result = await this.aggregate([
    { $match: { store: storeId } },
    {
      $group: {
        _id: "$store",
        avgRating: { $avg: "$ratingValue" },
        count: { $sum: 1 },
      },
    },
  ]);
  return result.length > 0 ? result[0] : { avgRating: 0, count: 0 };
};

module.exports = mongoose.model("Rating", ratingSchema);
