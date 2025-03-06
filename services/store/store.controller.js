const { Store, Dish, ToppingGroup, Staff, Rating, Category } = require("./store.model");
const { Order } = require("../order/order.model")
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");
const { query } = require("express");
const mongoose = require("mongoose");

// THIS FUNCTION IS MADE TO OPTIMIZE THE PAGING BUT PENDING
const getPaginatedData = async (req, res, Model, filterOptions = {}, populateFields = "") => {
    try {
        const { store_id, no } = req.params;
        const pageSize = 10;
        const page = parseInt(no);

        if (page < 1) {
            return res.status(400).json({ success: false, message: "Invalid page number" });
        }

        // Create a filter object with store_id
        let filter = { store: store_id, ...filterOptions };

        // Count total documents
        const totalItems = await Model.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / pageSize);
        const skip = (page - 1) * pageSize;

        // Fetch paginated data
        let query = Model.find(filter).skip(skip).limit(pageSize);
        if (populateFields) query = query.populate(populateFields);

        const data = await query;

        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: `${Model.modelName} not found` });
        }

        res.status(200).json({
            success: true,
            total: totalItems,
            totalPages,
            currentPage: page,
            pageSize,
            data,
        });

    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ success: false, message: "Invalid store ID format" });
        } else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

// [GET] /api/store/{store_id}/dish?name=[name]&category=[category]&limit=[limit]&page=[page]
const getAllDish = async (req, res) => {
    try {
        const { store_id } = req.params; // Lấy store_id từ URL
        const { name, category, limit, page } = req.query; // Lấy query params

        // Tạo bộ lọc tìm kiếm
        let filter = { store: store_id };
        if (name) {
            filter.name = { $regex: name, $options: "i" }; // Tìm món theo tên (không phân biệt chữ hoa/thường)
        }
        if (category) {
            filter.category = category; // Lọc theo category ID
        }

        let dishesQuery = Dish.find(filter).populate("category", "name");

        // Kiểm tra nếu có phân trang
        if (limit && page) {
            const pageSize = parseInt(limit);
            const pageNumber = parseInt(page);

            if (pageNumber < 1 || pageSize < 1) {
                return res.status(400).json({ success: false, message: "Invalid page or limit number" });
            }

            // Đếm tổng số món ăn theo filter
            const totalDishes = await Dish.countDocuments(filter);
            const totalPages = Math.ceil(totalDishes / pageSize);

            // Nếu số trang yêu cầu lớn hơn tổng số trang -> trả về trang cuối cùng
            const skip = (pageNumber - 1) * pageSize;

            dishesQuery = dishesQuery.skip(skip).limit(pageSize);
        }

        // Truy vấn danh sách món ăn
        const dishes = await dishesQuery;

        if (!dishes || dishes.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Dishes not found",
            });
        }

        res.status(200).json({
            success: true,
            total: limit && page ? await Dish.countDocuments(filter) : dishes.length,
            data: dishes,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid store ID format",
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// [GET] /?name=[name]&category=[category]&sort=[name||rating||standout]&limit=[limit]&page=[page]
const getAllStore = async (req, res) => {
    try {
        const { name, category, sort, limit, page } = req.query;

        // Tạo bộ lọc tìm kiếm
        let filter = {};
        if (name) {
            filter.name = { $regex: name, $options: "i" };
        }
        if (category) {
            filter.storeCategory = category; // Corrected category filter
        }

        let storeQuery = Store.find(filter);

        // Sắp xếp theo rating hoặc số đơn hàng
        if (sort) {
            if (sort === "rating") {
                storeQuery = storeQuery
                    .lean()
                    .then(async (stores) => {
                        const storeRatings = await Rating.aggregate([
                            { $group: { _id: "$store", avgRating: { $avg: "$ratingValue" } } },
                        ]);

                        // Gán rating vào store
                        stores = stores.map((store) => {
                            const rating = storeRatings.find((r) => r._id.equals(store._id));
                            return { ...store, avgRating: rating ? rating.avgRating : 0 };
                        });

                        return stores.sort((a, b) => b.avgRating - a.avgRating);
                    });
            } else if (sort === "name") {
                storeQuery = storeQuery.sort({ name: 1 });
            } else if (sort === "standout") {
                storeQuery = storeQuery
                    .lean()
                    .then(async (stores) => {
                        const storeOrders = await Order.aggregate([
                            { $group: { _id: "$store", orderCount: { $sum: 1 } } },
                        ]);

                        // Gán orderCount vào store
                        stores = stores.map((store) => {
                            const order = storeOrders.find((o) => o._id.equals(store._id));
                            return { ...store, orderCount: order ? order.orderCount : 0 };
                        });

                        return stores.sort((a, b) => b.orderCount - a.orderCount);
                    });
            }
        }

        // Kiểm tra nếu có phân trang
        if (limit && page) {
            const pageSize = parseInt(limit);
            const pageNumber = parseInt(page);

            if (pageNumber < 1 || pageSize < 1) {
                return res.status(400).json({ success: false, message: "Invalid page or limit number" });
            }

            const totalStores = await Store.countDocuments(filter);
            const totalPages = Math.ceil(totalStores / pageSize);
            const skip = (pageNumber - 1) * pageSize;

            storeQuery = storeQuery.skip(skip).limit(pageSize);
        }

        // Truy vấn danh sách cửa hàng
        let stores = await storeQuery;

        if (!stores || stores.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Stores not found",
            });
        }

        res.status(200).json({
            success: true,
            total: limit && page ? await Store.countDocuments(filter) : stores.length,
            data: stores,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid format",
            });
        }
        res.status(500).json({ success: false, message: error.message });
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

const getAllTopping = (req, res) => getPaginatedData(req, res, ToppingGroup);
const getAllCategory = (req, res) => {
    const { name } = req.query;
    let filterOptions = {};
    if (name) {
        filterOptions.name = { $regex: name, $options: "i" };
    }
    getPaginatedData(req, res, Category, filterOptions, "name");
};
const getAllStaff = (req, res) => {
    const { name, role } = req.query;
    let filterOptions = {};
    if (name) filterOptions.name = { $regex: name, $options: "i" };
    if (role) filterOptions.role = role;

    getPaginatedData(req, res, Staff, filterOptions, "name");
};
const getAllOrder = (req, res) => {
    const { status } = req.query;
    let filterOptions = {};
    if (status) filterOptions.status = status;

    getPaginatedData(req, res, Order, filterOptions);
};

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
    deleteToppingGroup, addToppingToDish, getAllStore
    
};
