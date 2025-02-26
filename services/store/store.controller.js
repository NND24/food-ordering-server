const Store = require("./store.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");
const { query } = require("express");

const Dish = require("../models/dish"); // Import model Dish


// [GET] api/store/[store_id]/dish/page/[no]?name=[name]&category=[category]
const getAllDish = async (req, res) => {
    try {
        const { store_id, no } = req.params; // Lấy store_id và số trang từ URL
        const { name, category } = req.query; // Lấy query params nếu có

        const pageSize = 10; // Số món ăn trên mỗi trang
        const page = parseInt(no);

        if (page < 1) {
            return res.status(400).json({ success: false, message: "Invalid page number" });
        }

        // Tạo bộ lọc tìm kiếm
        let filter = { store: store_id };
        if (name) {
            filter.name = { $regex: name, $options: "i" }; // Tìm món theo tên (không phân biệt chữ hoa/thường)
        }
        if (category) {
            filter.category = category; // Lọc theo category ID
        }

        // Đếm tổng số món ăn theo filter
        const totalDishes = await Dish.countDocuments(filter);
        const totalPages = Math.ceil(totalDishes / pageSize); // Tính tổng số trang

        // Nếu số trang yêu cầu lớn hơn tổng số trang -> trả về trang cuối cùng
        const skip = (page - 1) * pageSize;

        // Truy vấn danh sách món ăn
        const dishes = await Dish.find(filter)
            .populate("category", "name") // Lấy thông tin category
            .skip(skip)
            .limit(pageSize);
        if (!dishes || dishes.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Dishes not found",
            });
        }

        res.status(200).json({
            success: true,
            total: totalDishes,
            totalPages,
            currentPage: page,
            pageSize,
            data: dishes,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid store ID format",
            });
        }
        else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
// [GET] api/store/[store_id]
const getStoreInformation = async (req, res) => {
    try {
        const { store_id } = req.params; // Extract store_id correctly

        // Find store by ID
        const store = await Store.findById(store_id);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Store not found",
            });
        }

        res.status(200).json({
            success: true,
            data: store,
        });
    } catch (error) {
        // Handle invalid ObjectId error
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid store ID format",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
// [GET] api/store/[store_id]/topping/page/[no]
const getAllTopping = async (req, res) => {
    try {
        const { store_id, no } = req.params; // Lấy store_id và số trang từ URL

        const pageSize = 10; // Số món ăn trên mỗi trang
        const page = parseInt(no);

        if (page < 1) {
            return res.status(400).json({ success: false, message: "Invalid page number" });
        }

        // Tạo bộ lọc tìm kiếm
        let filter = { store: store_id };


        // Đếm tổng số món ăn theo filter
        const totalTopping = await ToppingGroup.countDocuments(filter);
        const totalPages = Math.ceil(totalDishes / pageSize); // Tính tổng số trang

        // Nếu số trang yêu cầu lớn hơn tổng số trang -> trả về trang cuối cùng
        const skip = (page - 1) * pageSize;

        // Truy vấn danh sách món ăn
        const toppings = await ToppingGroup.find(filter)
            .skip(skip)
            .limit(pageSize);
        if (!toppings || toppings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Topping not found",
            });
        }

        res.status(200).json({
            success: true,
            total: totalTopping,
            totalPages,
            currentPage: page,
            pageSize,
            data: toppings,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid store ID format",
            });
        }
        else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};


// [GET] api/store/[store_id]/category/page/[no]?name=[name]
const getAllCategory = async (req, res) => {
    try {
        const { store_id, no } = req.params; // Lấy store_id và số trang từ URL
        const { name } = req.query;
        const pageSize = 10; // Số món ăn trên mỗi trang
        const page = parseInt(no);

        if (page < 1) {
            return res.status(400).json({ success: false, message: "Invalid page number" });
        }

        // Tạo bộ lọc tìm kiếm
        let filter = { store: store_id };
        if (name) {
            filter.name = { $regex: name, $options: "i" };
        }

        // Đếm tổng số món ăn theo filter
        const totalCategory = await Category.countDocuments(filter);
        const totalPages = Math.ceil(totalDishes / pageSize); // Tính tổng số trang

        // Nếu số trang yêu cầu lớn hơn tổng số trang -> trả về trang cuối cùng
        const skip = (page - 1) * pageSize;

        // Truy vấn danh sách món ăn
        const categorys = await Category.find(filter)
            .populate("name")
            .skip(skip)
            .limit(pageSize);
        if (!toppings || toppings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Topping not found",
            });
        }

        res.status(200).json({
            success: true,
            total: totalTopping,
            totalPages,
            currentPage: page,
            pageSize,
            data: toppings,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid store ID format",
            });
        }
        else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};


module.exports = { getAllDish, getStoreInformation, getAllTopping };
