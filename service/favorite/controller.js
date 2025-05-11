const Favorite  = require("./shared/model/favorite");
const Store = require("./shared/model/store")
const Rating = require("./shared/model/rating")

const createError = require("./shared/utils/createError");

const asyncHandler = require("express-async-handler");
const { query } = require("express");
const mongoose = require("mongoose");

const getUserFavorite = async (req, res) => {
  try {
    const userId = req?.user?._id;
    // Tạo bộ lọc tìm kiếm
    let filter = { user: userId };

    // Truy vấn danh sách món ăn
    const favorite = await Favorite.findOne(filter)
      .populate({
        path: "store",
        populate: {
          path: "storeCategory",
        },
      })
      .lean();

    if (!favorite || favorite.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }

    const storeRatings = await Rating.aggregate([
      { $group: { _id: "$store", avgRating: { $avg: "$ratingValue" }, amountRating: { $sum: 1 } } },
    ]);
    favorite.store = favorite.store.map((store) => {
      const rating = storeRatings.find((r) => r._id.toString() == store._id.toString());
      return { ...store, avgRating: rating ? rating.avgRating : 0, amountRating: rating ? rating.amountRating : 0 };
    });

    res.status(200).json({
      success: true,
      data: favorite,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const addFavorite = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const { storeId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (!storeId) {
      return res.status(400).json({ success: false, message: "Invalid request body" });
    }

    // Check if the store exsited in the system
    let store = await Store.findById(storeId);
    if (!store) {
      return res.status(400).json({
        success: false,
        message: "Store not exsited in system",
      });
    }

    // Check if the favorite record exists for the user
    let favoriteRecord = await Favorite.findOne({ user: userId });

    if (!favoriteRecord) {
      // If the user has no favorites, create a new entry
      favoriteRecord = new Favorite({
        user: userId,
        store: [storeId],
      });
    } else {
      // Prevent duplicate store entries
      if (!favoriteRecord.store.includes(storeId)) {
        favoriteRecord.store.push(storeId);
      } else {
        return res.status(400).json({ success: false, message: "Store is already in favorites" });
      }
    }

    await favoriteRecord.save();

    return res.status(201).json({
      success: true,
      message: "Favorite updated successfully",
      favorite: favoriteRecord,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const { storeId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (!storeId) {
      return res.status(400).json({ success: false, message: "Invalid request body" });
    }

    // Check if the store exsited in the system
    let store = await Store.findById(storeId);
    if (!store) {
      return res.status(400).json({
        success: false,
        message: "Store not exsited in system",
      });
    }

    // Find the user's favorite record
    let favoriteRecord = await Favorite.findOne({ user: userId });

    if (!favoriteRecord) {
      return res.status(404).json({ success: false, message: "Favorite list not found" });
    }

    // Remove the store from the list
    favoriteRecord.store = favoriteRecord.store.filter((id) => id.toString() !== storeId.toString());

    // If no stores remain, delete the favorite document
    if (favoriteRecord.store.length === 0) {
      await Favorite.deleteOne({ _id: favoriteRecord._id });
      return res.status(200).json({ success: true, message: "Favorite list is now empty and has been deleted" });
    }

    await favoriteRecord.save();

    return res.status(200).json({
      success: true,
      message: "Store removed from favorites",
      favorite: favoriteRecord,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeAllFavorite = async (req, res) => {
  try {
    const userId = req?.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Find and delete the cart
    await Favorite.deleteMany({ user: userId });

    res.status(200).json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUserFavorite, addFavorite, removeFavorite, removeAllFavorite };
