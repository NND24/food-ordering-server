const mongoose = require("mongoose");

var foodTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  image: {
    filePath: { type: String, required: false },
    url: {
      type: String,
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
});

foodTypeSchema.statics.isNameExists = async function (foodName) {
  const food = await this.findOne({ name: foodName }).exec();
  return food !== null;
};

module.exports = mongoose.model("FoodType", foodTypeSchema);
