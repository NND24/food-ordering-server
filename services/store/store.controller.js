const { Store, Dish, ToppingGroup, Staff, Rating, Category } = require("./store.model");
const { Order } = require("../order/order.model")
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");
const { query } = require("express");
const mongoose = require("mongoose");

// THIS FUNCTION IS MADE TO OPTIMIZE THE PAGING BUT PENDING
const fetchPaginatedData = async (Model, query, page, limit, populateFields = []) => {
    const totalItems = await Model.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.min(page, totalPages);

    const dataQuery = Model.find(query)
        .skip((currentPage - 1) * limit)
        .limit(limit);

    if (populateFields.length) {
        populateFields.forEach(field => dataQuery.populate(field));
    }

    const results = await dataQuery;
    return { totalItems, totalPages, currentPage, results };
};

// [GET] /[store_id]/dish/page/[no]?name=[name]&category=[category]
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
// [GET] /[store_id]
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
            message: error.message,
        });
    }
};
// [GET] /[store_id]/topping/page/[no]
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
        const totalPages = Math.ceil(totalTopping / pageSize); // Tính tổng số trang

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


// [GET] /[store_id]/category/page/[no]?name=[name]
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
        const totalPages = Math.ceil(totalCategory / pageSize); // Tính tổng số trang

        // Nếu số trang yêu cầu lớn hơn tổng số trang -> trả về trang cuối cùng
        const skip = (page - 1) * pageSize;

        // Truy vấn danh sách món ăn
        const categorys = await Category.find(filter)
            .populate("name")
            .skip(skip)
            .limit(pageSize);
        if (!categorys || categorys.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            total: totalCategory,
            totalPages,
            currentPage: page,
            pageSize,
            data: categorys,
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


// [GET] /[store_id]/staff/page/[no]?name=[name]&role=[role]
const getAllStaff = async (req, res) => {
    try {
        const { store_id, no } = req.params; // Lấy store_id và số trang từ URL
        const { name, role } = req.query;
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
        if (role) {
            filter.role = role; // Lọc theo role
        }

        // Đếm tổng số món ăn theo filter
        const totalStaff = await Staff.countDocuments(filter);
        const totalPages = Math.ceil(totalStaff / pageSize); // Tính tổng số trang

        // Nếu số trang yêu cầu lớn hơn tổng số trang -> trả về trang cuối cùng
        const skip = (page - 1) * pageSize;

        // Truy vấn danh sách món ăn
        const staffs = await Staff.find(filter)
            .populate("name")
            .skip(skip)
            .limit(pageSize);
        if (!staffs || staffs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Staffs not found",
            });
        }

        res.status(200).json({
            success: true,
            total: totalStaff,
            totalPages,
            currentPage: page,
            pageSize,
            data: staffs,
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

// [GET] /[store_id]/order/page/[no]?status=[status]
const getAllOrder = async (req, res) => {
    try {
        const { store_id, no } = req.params;
        const { status } = req.query;
        const pageSize = 10; // Số món ăn trên mỗi trang
        const page = parseInt(no);

        if (page < 1) {
            return res.status(400).json({ success: false, message: "Invalid page number" });
        }

        // Tạo bộ lọc tìm kiếm
        let filter = { store: store_id };
        if (status) {
            filter.status = status
        }
        // Đếm tổng số món ăn theo filter
        const totalOrder = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrder / pageSize); // Tính tổng số trang

        // Nếu số trang yêu cầu lớn hơn tổng số trang -> trả về trang cuối cùng
        const skip = (page - 1) * pageSize;

        // Truy vấn danh sách món ăn
        const orders = await Order.find(filter)
            .skip(skip)
            .limit(pageSize);
        if (!orders || orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        res.status(200).json({
            success: true,
            total: totalOrder,
            totalPages,
            currentPage: page,
            pageSize,
            data: orders,
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

}

// [GET] /order/[order_id]
const getOrder = async (req, res) => {
    try {
        const { order_id } = req.params;

        // Truy vấn danh sách món ăn
        const order = await Order.findById(order_id)

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        res.status(200).json({
            success: true,
            data: order,
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
}

// [GET] /dish/[dish_id]
const getDish = async (req, res) => {
    try {
        const { dish_id } = req.params;

        // Truy vấn danh sách món ăn
        const dish = await Dish.findById(dish_id)

        if (!dish) {
            return res.status(404).json({
                success: false,
                message: "Dish not found",
            });
        }

        res.status(200).json({
            success: true,
            data: dish,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid format",
            });
        }
        else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

const getTopping = async (req, res) => {
    try {
        const { group_id } = req.params;

        // Truy vấn danh sách món ăn
        const toppingGroup = await ToppingGroup.findById(group_id)

        if (!toppingGroup) {
            return res.status(404).json({
                success: false,
                message: "Topping group not found",
            });
        }

        res.status(200).json({
            success: true,
            data: toppingGroup,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid format",
            });
        }
        else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

const getCategory = async (req, res) => {
    try {
        const { category_id } = req.params;

        // Truy vấn danh sách món ăn
        const category = await Category.findById(category_id)

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Topping group not found",
            });
        }

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid format",
            });
        }
        else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

const getStaff = async (req, res) => {
    try {
        const { staff_id } = req.params;

        // Truy vấn danh sách món ăn
        const staff = await Staff.findById(staff_id)

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff not found",
            });
        }

        res.status(200).json({
            success: true,
            data: staff,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid format",
            });
        }
        else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

// const getRating = async (req, res) => {
//     try {
//         const { dish_id } = req.params;

//         // Truy vấn danh sách món ăn
//         const reviews = await Rating.find({ dish: dish_id }).populate("user");

//         if (!reviews) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Reviews not found",
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: reviews,
//         });
//     } catch (error) {
//         if (error.name === "CastError") {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid format",
//             });
//         }
//         else {
//             res.status(500).json({ success: false, message: error.message });
//         }
//     }
// }

const getAvgRating = async (req, res) => {
    try {
        const { dish_id } = req.params;
        const objectId = new mongoose.Types.ObjectId(dish_id);
        // Truy vấn danh sách món ăn
        const points = await Rating.getAverageRating(objectId)

        if (!points) {
            return res.status(404).json({
                success: false,
                message: "Reviews not found for calculate",
            });
        }

        res.status(200).json({
            success: true,
            data: points,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid format",
            });
        }
        else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

const getAllRating = async (req, res) => {
    try {
        const { dish_id, no } = req.params; // Lấy store_id và số trang từ URL

        const pageSize = 10; // Số món ăn trên mỗi trang
        const page = parseInt(no);

        if (page < 1) {
            return res.status(400).json({ success: false, message: "Invalid page number" });
        }

        // Tạo bộ lọc tìm kiếm
        let filter = { dish: dish_id };


        // Đếm tổng số món ăn theo filter
        const totalRating = await Rating.countDocuments(filter);
        const totalPages = Math.ceil(totalRating / pageSize); // Tính tổng số trang

        // Nếu số trang yêu cầu lớn hơn tổng số trang -> trả về trang cuối cùng
        const skip = (page - 1) * pageSize;

        // Truy vấn danh sách món ăn
        const ratings = await Rating.find(filter)
            .skip(skip)
            .limit(pageSize);
        if (!ratings || ratings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Rating not found",
            });
        }

        res.status(200).json({
            success: true,
            total: totalRating,
            totalPages,
            currentPage: page,
            pageSize,
            data: ratings,
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
}

const getAvgStoreRating = async (req, res) => {
    try {
        const { store_id } = req.params;
        const objectId = new mongoose.Types.ObjectId(store_id);
        // Truy vấn danh sách món ăn
        const points = await Rating.getStoreRatingSummary(objectId)

        if (!points) {
            return res.status(404).json({
                success: false,
                message: "Reviews not found for calculate",
            });
        }

        res.status(200).json({
            success: true,
            data: points,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid format",
            });
        }
        else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

const getToppingFromDish = async (req, res) => {
    try {
        const { dish_id } = req.params;
    
        // Fetch the dish with its topping groups
        const dish = await Dish.findById(dish_id).populate("toppingGroups");
        if (!dish) {
            return res.status(404).json({
                success: false,
                message: "Dish not found",
            });
        }
    
        // Ensure toppings exist
        if (!dish.toppingGroups || dish.toppingGroups.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No topping groups found for this dish",
            });
        }
    
        return res.status(200).json({
            success: true,
            message: "Toppings retrieved successfully",
            data: dish.toppingGroups,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid dish ID format",
            });
        }
        return res.status(500).json({ success: false, message: error.message });
    }    
}
const createToppingGroup = async (req, res) => {
    try {
        const { store_id } = req.params;
        const { name, toppings } = req.body;

        // Validate store_id
        const store = await Store.findById(store_id);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Store not found",
            });
        }

        // Create a new ToppingGroup
        const toppingGroup = new ToppingGroup({
            name,
            store: store_id,
            toppings, // Expecting an array of toppings from request body
        });

        // Save to database
        await toppingGroup.save();

        return res.status(201).json({
            success: true,
            message: "Topping group created successfully",
            data: toppingGroup,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid store ID format",
            });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

const addToppingToGroup = async (req, res) => {
    try {
        const { group_id } = req.params;
        const { name, price } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "Topping name and price are required",
            });
        }

        // Find the topping group
        let toppingGroup = await ToppingGroup.findById(group_id);
        if (!toppingGroup) {
            return res.status(404).json({
                success: false,
                message: "Topping group not found",
            });
        }

        // Add the new topping
        toppingGroup.toppings.push({ name, price });

        // Save the updated group
        await toppingGroup.save();

        return res.status(200).json({
            success: true,
            message: "Topping added successfully",
            data: toppingGroup,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const removeToppingFromGroup = async (req, res) => {
    try {
        const { group_id, topping_id } = req.params;

        // Find the topping group
        let toppingGroup = await ToppingGroup.findById(group_id);
        if (!toppingGroup) {
            return res.status(404).json({
                success: false,
                message: "Topping group not found",
            });
        }

        // Find and remove the topping
        const initialLength = toppingGroup.toppings.length;
        toppingGroup.toppings = toppingGroup.toppings.filter(
            (topping) => topping._id.toString() !== topping_id
        );

        if (toppingGroup.toppings.length === initialLength) {
            return res.status(404).json({
                success: false,
                message: "Topping not found in the group",
            });
        }

        // Save the updated group
        await toppingGroup.save();

        return res.status(200).json({
            success: true,
            message: "Topping removed successfully",
            data: toppingGroup,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteToppingGroup = async (req, res) => {
    try {
        const { group_id } = req.params;

        // Find and delete the topping group
        const toppingGroup = await ToppingGroup.findByIdAndDelete(group_id);
        if (!toppingGroup) {
            return res.status(404).json({
                success: false,
                message: "Topping group not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Topping group deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const addToppingToDish = async (req, res) => {
    try {
        const { dish_id } = req.params;
        const { topping_ids } = req.body; // Expecting an array of topping IDs

        if (!Array.isArray(topping_ids) || topping_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Topping IDs must be a non-empty array",
            });
        }

        // Find the dish
        let dish = await Dish.findById(dish_id);
        if (!dish) {
            return res.status(404).json({
                success: false,
                message: "Dish not found",
            });
        }

        // Find all topping groups that contain these toppings
        let toppingGroups = await ToppingGroup.find({
            "toppings._id": { $in: topping_ids }
        });

        if (!toppingGroups || toppingGroups.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No valid toppings found",
            });
        }

        // Extract valid toppings from the groups
        let validToppings = [];
        toppingGroups.forEach(group => {
            let filteredToppings = group.toppings.filter(topping =>
                topping_ids.includes(topping._id.toString())
            );
            validToppings.push(...filteredToppings);
        });

        if (validToppings.length === 0) {
            return res.status(400).json({
                success: false,
                message: "None of the provided topping IDs are valid",
            });
        }

        // Ensure dish has a toppings field
        if (!dish.toppings) {
            dish.toppings = [];
        }

        // Filter out toppings that are already added to the dish
        let newToppings = validToppings.filter(
            topping => !dish.toppings.some(
                existingTopping => existingTopping._id.toString() === topping._id.toString()
            )
        );

        if (newToppings.length === 0) {
            return res.status(400).json({
                success: false,
                message: "All provided toppings are already added to the dish",
            });
        }

        // Add new toppings to the dish
        dish.toppings.push(...newToppings);

        // Save the updated dish
        await dish.save();

        return res.status(200).json({
            success: true,
            message: "Toppings added to dish successfully",
            data: dish,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};





module.exports = {
    getAllDish, getStoreInformation,
    getAllTopping, getAllCategory, getAllStaff, getOrder,
    getAllOrder, getDish, getTopping, getCategory, getStaff,
    getAvgRating, getAllRating, getAvgStoreRating, getToppingFromDish,
    createToppingGroup, addToppingToGroup, removeToppingFromGroup, 
    deleteToppingGroup, addToppingToDish
    
};
