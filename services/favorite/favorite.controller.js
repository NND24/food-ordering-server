const { Favorite } = require("./favorite.model")
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");
const { query } = require("express");
const mongoose = require("mongoose");

const getUserFavorite = async (req, res) => {
    try {
        const userId = req?.user?._id;
        // Tạo bộ lọc tìm kiếm
        let filter = { user: userId };

        // Truy vấn danh sách món ăn
        const favorite = await Favorite.find(filter);
        if (!favorite || favorite.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Favorite not found",
            });
        }

        res.status(200).json({
            success: true,
            data: favorite,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message });
    }

}

module.exports = { getUserFavorite };