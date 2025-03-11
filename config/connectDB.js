const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB Connection Succeeded.");
  } catch (error) {
    console.error("Error in DB connection: " + error.message);
  }
};

module.exports = connectDB;
