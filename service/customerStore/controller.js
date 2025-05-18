const Category = require("./shared/model/category");
const FoodType = require("./shared/model/foodType");
const ToppingGroup = require("./shared/model/toppingGroup");
const Topping = require("./shared/model/topping");
const Store = require("./shared/model/store");
const Rating = require("./shared/model/rating");
const Dish = require("./shared/model/dish");
const Order = require("./shared/model/order");

const { getPaginatedData } = require("./shared/utils/paging");

const getAllStore = async (req, res) => {
  try {
    const { name, category, sort, limit, page, lat, lon } = req.query;
    let filterOptions = {};
    filterOptions.status = "APPROVED";
    if (name) filterOptions.name = { $regex: name, $options: "i" };
    if (category) {
      const categories = Array.isArray(category) ? category : category.split(",");
      filterOptions.storeCategory = { $in: categories };
    }

    // Fetch all stores first
    let stores = await Store.find(filterOptions).populate("storeCategory").lean();

    const storeRatings = await Rating.aggregate([
      {
        $group: {
          _id: "$store",
          avgRating: { $avg: "$ratingValue" },
          amountRating: { $sum: 1 },
        },
      },
    ]);
    stores = stores.map((store) => {
      const rating = storeRatings.find((r) => r._id.toString() == store._id.toString());
      return {
        ...store,
        avgRating: rating ? rating.avgRating : 0,
        amountRating: rating ? rating.amountRating : 0,
      };
    });

    if (lat && lon) {
      const latUser = parseFloat(lat);
      const lonUser = parseFloat(lon);

      const toRad = (value) => (value * Math.PI) / 180;

      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // bán kính Trái Đất (km)
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
      };

      // Sau khi tính khoảng cách
      stores = stores.map((store) => {
        if (store.address?.lat != null && store.address?.lon != null) {
          store.distance = calculateDistance(latUser, lonUser, store.address.lat, store.address.lon);
        } else {
          store.distance = Infinity;
        }
        return store;
      });

      // Lọc các store trong 70
      const storesWithin70km = stores.filter((store) => store.distance <= 70);

      // Nếu có store nào trong 70km thì chỉ lấy các store đó, nếu không thì lấy tất cả
      if (storesWithin70km.length > 0) {
        stores = storesWithin70km;
      }
    }

    // Apply sorting manually
    if (sort === "rating") {
      stores = stores.sort((a, b) => b.avgRating - a.avgRating);
    } else if (sort === "standout") {
      const storeOrders = await Order.aggregate([{ $group: { _id: "$store", orderCount: { $sum: 1 } } }]);
      stores = stores
        .map((store) => {
          const order = storeOrders.find((o) => o._id.toString() == store._id.toString());
          return {
            ...store,
            orderCount: order ? order.orderCount : 0,
          };
        })
        .sort((a, b) => b.orderCount - a.orderCount);
    } else if (sort === "name") {
      stores.sort((a, b) => a.name.localeCompare(b.name));
    }
    const totalItems = stores.length;
    if (limit && page) {
      // Apply pagination manually
      const pageSize = parseInt(limit) || 10;
      const pageNumber = parseInt(page) || 1;
      const totalPages = Math.ceil(totalItems / pageSize);
      const paginatedStores = stores.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

      res.status(200).json({
        success: true,
        total: totalItems,
        totalPages,
        currentPage: pageNumber,
        pageSize,
        data: paginatedStores,
      });
    } else {
      res.status(200).json({
        success: true,
        total: totalItems,
        data: stores,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStoreInformation = async (req, res) => {
  try {
    const { store_id } = req.params; // Extract store_id correctly

    // Find store by ID
    const store = await Store.findById(store_id).populate("storeCategory");

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // Calculate average rating
    const storeRatings = await Rating.aggregate([
      { $match: { store: store._id } }, // Only consider ratings for this store
      {
        $group: {
          _id: "$store",
          avgRating: { $avg: "$ratingValue" },
          amountRating: { $sum: 1 },
        },
      },
    ]);

    // Find rating data for the store
    const avgRating = storeRatings.length > 0 ? storeRatings[0].avgRating : 0;
    const amountRating = storeRatings.length > 0 ? storeRatings[0].amountRating : 0;

    res.status(200).json({
      success: true,
      data: {
        ...store.toObject(),
        avgRating,
        amountRating,
      },
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

const getAllDish = async (req, res) => {
  try {
    const { store_id } = req.params;
    const { name, limit, page } = req.query;

    let filterOptions = { store: store_id };
    if (name) filterOptions.name = { $regex: name, $options: "i" };
    const response = await getPaginatedData(
      Dish,
      filterOptions,
      [
        { path: "category", select: "name" },
        {
          path: "toppingGroups",
          select: "name toppings",
          populate: { path: "toppings", select: "name price" },
        },
      ],
      limit,
      page
    );

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDish = async (req, res) => {
  try {
    const { dish_id } = req.params;

    // Truy vấn danh sách món ăn
    const dish = await Dish.findById(dish_id).populate([
      { path: "category", select: "name" },
      {
        path: "toppingGroups",
        select: "name toppings",
        populate: { path: "toppings", select: "name price" },
      },
    ]);

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
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

const getAllOrder = async (req, res) => {
  try {
    const { status, limit, page, name } = req.query;
    const { store_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(store_id)) {
      return res.status(400).json({ success: false, message: "Invalid store_id format" });
    }

    let filterOptions = { store: store_id };

    if (status) {
      const statusArray = Array.isArray(status) ? status : status.split(",");
      filterOptions.status = { $in: statusArray };
    }

    // Add search filter if name query is present
    if (name && name.trim() !== "") {
      const regex = new RegExp(name, "i"); // Case-insensitive search
      filterOptions.$or = [{ customerName: regex }, { customerPhonenumber: regex }];
    }

    const response = await getPaginatedData(
      Order,
      filterOptions,
      [
        { path: "store" },
        { path: "user", select: "name email avatar" },
        { path: "items.dish", select: "name price image description" },
        { path: "items.toppings", select: "name price" },
        { path: "shipper", select: "name email avatar" },
      ],
      limit,
      page
    );

    // Filter again in memory to support search on user.name
    if (name && name.trim() !== "") {
      const regex = new RegExp(name, "i");
      response.data = response.data.filter(
        (order) =>
          order.user?.name?.match(regex) || order.customerName?.match(regex) || order.customerPhonenumber?.match(regex)
      );
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const { order_id } = req.params;

    const order = await Order.findById(order_id).populate([
      { path: "store", select: "name" },
      { path: "user", select: "name email avatar" },
      { path: "items.dish", select: "name price" },
      { path: "items.toppings", select: "name price" },
    ]);

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
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

const getToppingFromDish = async (req, res) => {
  try {
    const { dish_id } = req.params;

    // Fetch the dish with its topping groups and toppings
    const dish = await Dish.findById(dish_id).populate({
      path: "toppingGroups",
      populate: {
        path: "toppings",
      },
    });

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    if (!dish.toppingGroups || dish.toppingGroups.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No topping groups found for this dish",
      });
    }

    // Sanitize: remove toppingGroup field from each topping
    const cleanedToppingGroups = dish.toppingGroups.map((group) => {
      const cleanedToppings = group.toppings.map((topping) => {
        const { toppingGroup, ...rest } = topping.toObject(); // Remove toppingGroup
        return rest;
      });
      return {
        ...group.toObject(),
        toppings: cleanedToppings,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Toppings retrieved successfully",
      data: cleanedToppingGroups,
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
};

module.exports = {
  getAllStore,
  getStoreInformation,
  getAllDish,
  getDish,
  getAllOrder,
  getOrder,
  getToppingFromDish,
};
