// const mongoose = require("mongoose");

// var ratingSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     store: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Store",
//       required: true,
//     },
//     dishes: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Dish",
//       },
//     ],
//     ratingValue: {
//       type: Number,
//       required: true,
//       min: 1,
//       max: 5, // 1-5 star rating system
//     },
//     comment: {
//       type: String,
//       default: "", // Empty string if no comment
//     },
//     images: [
//       {
//         filePath: String,
//         url: String,
//       },
//     ],
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Rating", ratingSchema);
