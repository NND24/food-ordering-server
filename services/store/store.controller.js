const { Store, Dish, ToppingGroup, Staff, Rating, Category, Topping } = require("./store.model");

const { getSocketIo } = require("../../utils/socketManager");
const Order = require("../order/order.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");
const { query } = require("express");
const mongoose = require("mongoose");
const User = require("../user/user.model");
const { getPaginatedData } = require("../../utils/paging");
const FoodType = require("../foodType/foodType.model");

// [GET] /:store_id/dish
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
          populate: { path: "toppings", select: "name price" }, // Correctly populates toppings inside toppingGroups
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

const getAllStore = async (req, res) => {
  try {
    const { name, category, sort, limit, page, lat, lon } = req.query;
    let filterOptions = {};
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

// [GET] /[store_id]
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

const getAllTopping = async (req, res) => {
  try {
    const { limit, page } = req.query;
    const { store_id } = req.params;
    let filterOptions = { store: store_id };

    const response = await getPaginatedData(
      ToppingGroup,
      filterOptions,
      [
        {
          path: "toppings",
          select: "name price",
          // populate: { path: "toppings", select: "name price" } // Correctly populates toppings inside toppingGroups
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

const getAllCategory = async (req, res) => {
  try {
    const { name, limit, page } = req.query;
    let filterOptions = {};
    if (name) {
      filterOptions.name = { $regex: name, $options: "i" };
    }
    const response = await getPaginatedData(Category, filterOptions, null, limit, page);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllStaff = asyncHandler(async (req, res, next) => {
  const { store_id } = req.params;

  const store = await Store.findById(store_id).populate({
    path: "staff",
    select: "-password", // Exclude password from populated staff
  });
  if (!store) {
    return next(createError(404, "Cửa hàng không tồn tại"));
  }

  const sortedStaff = store.staff.sort((a, b) => {
    const roleA = a.role.includes("manager") ? 0 : 1; // Managers first (0), Staff later (1)
    const roleB = b.role.includes("manager") ? 0 : 1;
    return roleA - roleB;
  });

  res.status(200).json(sortedStaff);
});

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

// [GET] /order/[order_id]
const getOrder = async (req, res) => {
  try {
    const { order_id } = req.params;

    // Truy vấn danh sách món ăn
    const order = await Order.findById(order_id).populate([
      { path: "store", select: "name" }, // Include store details
      { path: "user", select: "name email avatar" }, // Include user details
      { path: "items.dish", select: "name price" }, // Include dish details
      { path: "items.toppings", select: "name price" }, // Include toppings details
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

// [GET] /dish/[dish_id]
const getDish = async (req, res) => {
  try {
    const { dish_id } = req.params;

    // Truy vấn danh sách món ăn
    const dish = await Dish.findById(dish_id).populate([
      { path: "category", select: "name" },
      {
        path: "toppingGroups",
        select: "name toppings",
        populate: { path: "toppings", select: "name price" }, // Correctly populates toppings inside toppingGroups
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

const getTopping = async (req, res) => {
  try {
    const { group_id } = req.params;

    // Truy vấn danh sách món ăn
    const toppingGroup = await ToppingGroup.findById(group_id).populate({
      path: "toppings",
      select: "-toppingGroup",
    });

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
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

const getCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    // Truy vấn danh sách món ăn
    const category = await Category.findById(category_id);

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
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

const getStaff = asyncHandler(async (req, res, next) => {
  const { store_id, staff_id } = req.params;

  const store = await Store.findById(store_id);
  if (!store) {
    return next(createError(404, "Cửa hàng không tồn tại"));
  }

  const staff = await User.findById(staff_id).select("-password");
  if (!staff || !store.staff.includes(staff_id)) {
    return next(createError(404, "Nhân viên không tồn tại trong cửa hàng này"));
  }

  res.status(200).json(staff);
});

const createStaff = asyncHandler(async (req, res, next) => {
  const { store_id } = req.params;
  const { name, email, phonenumber, gender, password, role } = req.body;

  const store = await Store.findById(store_id);
  if (!store) {
    return next(createError(404, "Cửa hàng không tồn tại"));
  }

  let user = await User.findOne({ email });

  // If the user already exists, check if they're already a staff member
  if (user) {
    if (store.staff.includes(user._id)) {
      return next(createError(409, "Người này đã là nhân viên của cửa hàng"));
    }
  } else {
    // Create a new user if they don't exist
    user = await User.create({
      name,
      email,
      phonenumber,
      gender,
      password,
      role: ["user", role], // Assign staff role
    });
  }

  // Ensure store.staff is initialized
  if (!store.staff) {
    store.staff = [];
  }

  // Add the user to the store's staff
  store.staff.push(user._id);
  await store.save();

  const userWithoutPassword = await User.findById(user._id).select("-password");

  res.status(201).json({
    message: "Nhân viên đã được thêm vào cửa hàng",
    staff: userWithoutPassword,
  });
});

const updateStaff = asyncHandler(async (req, res, next) => {
  const { store_id } = req.params;
  const { staff_id, name, email, phonenumber, gender, role } = req.body;

  const store = await Store.findById(store_id);
  if (!store) {
    return next(createError(404, "Cửa hàng không tồn tại"));
  }

  let staff = await User.findById(staff_id);
  if (!staff || !store.staff.includes(staff_id)) {
    return next(createError(404, "Nhân viên không tồn tại trong cửa hàng này"));
  }

  // Chỉ cho phép cập nhật role với các giá trị hợp lệ
  const validRoles = ["staff", "manager"];
  if (role && !validRoles.includes(role)) {
    return next(createError(400, "Vai trò không hợp lệ"));
  }

  // Cập nhật thông tin nhân viên
  if (name) staff.name = name;
  if (email) staff.email = email;
  if (phonenumber) staff.phonenumber = phonenumber;
  if (gender) staff.gender = gender;
  if (role) {
    console.log(role);
    const updatedRole = [role, "user"];
    staff.role = updatedRole;
  }
  await staff.save();

  res.status(200).json({ message: "Thông tin nhân viên đã được cập nhật", staff });
});

const getAvgRating = async (req, res) => {
  try {
    const { dish_id } = req.params;
    const objectId = new mongoose.Types.ObjectId(dish_id);
    // Truy vấn danh sách món ăn
    const points = await Rating.getAverageRating(objectId);

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
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

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
    const ratings = await Rating.find(filter).skip(skip).limit(pageSize);
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
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

const getAllStoreRating = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit, page, sort } = req.query;

    let filterOptions = { store: storeId };
    const result = await getPaginatedData(Rating, filterOptions, "user dishes", parseInt(limit), parseInt(page));

    if (sort === "desc") {
      result.data = result.data.sort((a, b) => b.ratingValue - a.ratingValue);
    } else if (sort === "asc") {
      result.data = result.data.sort((a, b) => a.ratingValue - b.ratingValue);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAvgStoreRating = async (req, res) => {
  try {
    const { store_id } = req.params;
    const objectId = new mongoose.Types.ObjectId(store_id);
    // Truy vấn danh sách món ăn
    const points = await Rating.getStoreRatingSummary(objectId);

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

const createToppingGroup = async (req, res) => {
  try {
    const { store_id } = req.params;
    const { name, onlyOnce, toppings } = req.body;

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
      onlyOnce,
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

    // Ensure price is stored as a Number
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice)) {
      return res.status(400).json({
        success: false,
        message: "Invalid price format",
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

    // Create a new Topping document
    const newTopping = await Topping.create({
      name,
      price: parsedPrice,
      toppingGroup: group_id, // Associate it with the group
    });

    // Push the new topping's ObjectId to the toppingGroup
    toppingGroup.toppings.push(newTopping._id);
    await toppingGroup.save();

    return res.status(200).json({
      success: true,
      message: "Topping added successfully",
      data: newTopping, // Returning the created topping
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addToppingGroup = async (req, res) => {
  try {
    const toppingGroup = req.body;
    const { store_id } = req.params;
    console.log("Store ID:", store_id);
    console.log("Topping Group:", toppingGroup);

    if (!toppingGroup.name || toppingGroup.name.trim() === "") {
      return res.status(400).json({ message: "Tên nhóm topping là bắt buộc." });
    }

    // Check if the topping group already exists
    const existingGroup = await ToppingGroup.findOne({ name: toppingGroup.name.trim() });
    if (existingGroup) {
      return res.status(409).json({ message: "Nhóm topping đã tồn tại." });
    }

    // Create new topping group
    const newGroup = new ToppingGroup({
      name: toppingGroup.name.trim(),
      store: store_id,
      toppings: [],
    });

    const savedGroup = await newGroup.save();
    return res.status(201).json(savedGroup);
  } catch (error) {
    console.error("Add Topping Group Error:", error);
    return res.status(500).json({ message: "Lỗi server khi thêm nhóm topping." });
  }
};

const deleteToppingGroup = async (req, res) => {
  try {
    const { group_id } = req.params;

    const deletedGroup = await ToppingGroup.findByIdAndDelete(group_id);

    if (!deletedGroup) {
      return res.status(404).json({ message: "Không tìm thấy nhóm topping." });
    }

    return res.status(200).json({ message: "Xóa nhóm topping thành công." });
  } catch (error) {
    console.error("Delete Topping Group Error:", error);
    return res.status(500).json({ message: "Lỗi server khi xóa nhóm topping." });
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
    toppingGroup.toppings = toppingGroup.toppings.filter((topping) => topping._id.toString() !== topping_id);

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
      "toppings._id": { $in: topping_ids },
    });

    if (!toppingGroups || toppingGroups.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid toppings found",
      });
    }

    // Extract valid toppings from the groups
    let validToppings = [];
    toppingGroups.forEach((group) => {
      let filteredToppings = group.toppings.filter((topping) => topping_ids.includes(topping._id.toString()));
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
      (topping) => !dish.toppings.some((existingTopping) => existingTopping._id.toString() === topping._id.toString())
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

const updateOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const updatedData = req.body;

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Filter out empty strings or undefined/null fields
    const filteredData = {};
    for (const key in updatedData) {
      const value = updatedData[key];
      if (value !== "" && value !== null && value !== undefined) {
        filteredData[key] = value;
      }
    }
    delete filteredData.shipper;

    Object.assign(order, filteredData);
    await order.save();

    return res.status(200).json({
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateDish = async (req, res) => {
  try {
    const { dish_id } = req.params; // Get order ID from the request parameters
    const updatedData = req.body; // Get the updated data from the request body

    // Ensure the order exists
    const dish = await Dish.findById(dish_id).populate([
      { path: "category", select: "name" },
      {
        path: "toppingGroups",
        select: "name toppings",
        populate: { path: "toppings", select: "name price" }, // Correctly populates toppings inside toppingGroups
      },
    ]);
    if (!dish) {
      return res.status(404).json({ message: "Dish not found" });
    }

    // Update the order with new data
    Object.assign(dish, updatedData);
    await dish.save();

    return res.status(200).json({
      message: "Dish updated successfully",
      data: dish,
    });
  } catch (error) {
    console.error("Error updating dish:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createDish = async (req, res) => {
  try {
    const { store_id } = req.params; // Get store ID from request parameters
    const dishData = req.body; // Get dish details from request body
    // Ensure required fields exist
    if (!dishData.name || !dishData.price) {
      return res.status(400).json({ message: "Dish name and price are required" });
    }

    Object.keys(dishData).forEach((key) => {
      if (dishData[key] === "") {
        delete dishData[key];
      }
    });
    // Check if the dish with the same name already exists in the same store
    const existingDish = await Dish.findOne({
      name: dishData.name,
      store: store_id,
    });
    if (existingDish) {
      return res.status(400).json({
        message: "A dish with this name already exists in the store.",
      });
    }

    // Create new dish
    const newDish = new Dish({
      ...dishData,
      store: store_id, // Associate the dish with the store
    });

    // Save dish to database
    await newDish.save();

    return res.status(201).json({
      message: "Dish created successfully",
      data: newDish,
    });
  } catch (error) {
    console.error("Error creating dish:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteDish = async (req, res) => {
  try {
    const { dish_id } = req.params;

    // Validate input
    if (!dish_id) {
      return res.status(400).json({ message: "Dish ID is required" });
    }

    // Check if the dish exists
    const dish = await Dish.findById(dish_id);
    if (!dish) {
      return res.status(404).json({ message: "Dish not found" });
    }

    // Delete the dish
    await Dish.findByIdAndDelete(dish_id);

    return res.status(200).json({
      message: "Dish deleted successfully",
      data: dish,
    });
  } catch (error) {
    console.error("Error deleting dish:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createCategory = async (req, res) => {
  try {
    const { store_id } = req.params;
    const { name } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Check if store exists
    const existingStore = await Store.findById(store_id);
    if (!existingStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Create new category
    const newCategory = new Category({
      name,
      store: store_id, // Assigning the store ID from params
    });

    // Save to database
    const savedCategory = await newCategory.save();

    res.status(201).json({ message: "Category created", category: savedCategory });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { category_id } = req.params;
    const { name } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Find and update category
    const updatedCategory = await Category.findByIdAndUpdate(
      category_id,
      { name },
      { new: true } // Return updated document
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category updated", category: updatedCategory });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    // Check if the category is used in any dish
    const dishesUsingCategory = await Dish.countDocuments({
      category: category_id,
    });

    if (dishesUsingCategory > 0) {
      return res.status(400).json({
        message: "Cannot delete category, it is used in one or more dishes",
        data: dishesUsingCategory,
      });
    }

    // Find and delete category
    const deletedCategory = await Category.findByIdAndDelete(category_id);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTopping = async (req, res) => {
  try {
    const { group_id, topping_id } = req.params;
    const { name, price } = req.body;

    // Validate input
    if (!name || price == null) {
      return res.status(400).json({ success: false, message: "Name and price are required" });
    }

    // Find and update the topping
    const updatedTopping = await Topping.findOneAndUpdate(
      { _id: topping_id, toppingGroup: group_id },
      { name, price },
      { new: true }
    );

    if (!updatedTopping) {
      return res.status(404).json({ success: false, message: "Topping not found" });
    }

    res.status(200).json({ success: true, data: updatedTopping });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateStore = async (req, res) => {
  try {
    const { store_id } = req.params;
    const updates = req.body;

    if (!store_id || !updates) {
      return res.status(400).json({ message: "Store ID and updates are required." });
    }

    // Ensure only allowed fields are updated
    const allowedUpdates = [
      "name",
      "description",
      "address",
      "storeCategory",
      "avatar",
      "cover",
      "paperWork.storePicture",
    ];

    const filteredUpdates = {};

    allowedUpdates.forEach((key) => {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    });

    const store = await Store.findByIdAndUpdate(
      store_id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ message: "Store not found." });
    }

    res.status(200).json({ message: "Store updated successfully.", store });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const registerStore = asyncHandler(async (req, res) => {
  const { owner, email, password, name, description, foodType, address } = req.body;
  let user = null;

  if (!name?.trim() || !address.full_address.trim()) {
    return res.status(400).json({ message: "Tên cửa hàng và địa chỉ là bắt buộc." });
  }
  if (!address.lat || !address.lon) {
    return res.status(400).json({ message: "Vui lòng cung cấp tọa độ địa chỉ." });
  }
  if (!owner) {
    // Kiểm tra xem người dùng có phải người dùng mới không
    if (!email || !password) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc." });
    } else {
      user = await User.create({
        name: email.split("@")[0],
        email: email.trim().toLowerCase(),
        password,
      });
    }
  } else {
    if (owner) {
      user = await User.findById(owner);
    }
  }
  let userId = user?._id;
  // Check if user already owns a store (double check )
  const ownStore = await Store.findOne({ owner: userId });
  if (ownStore) {
    return res.status(400).json({ message: "Người đăng ký đã sở hữu cửa hàng." });
  }

  // Check if store name already exists ( double check )
  const existingStore = await Store.findOne({ name: name.trim() });
  if (existingStore) {
    return res.status(400).json({ message: "Tên cửa hàng đã tồn tại!" });
  }
  // Create the store

  const store = await Store.create({
    name: name.trim(),
    owner: userId,
    description: description?.trim(),
    address: address,
    storeCategory: foodType,
    status: "BLOCKED",
  });

  // Update user role
  if (user.role && !user.role.includes("owner")) {
    user.role.push("owner");
    await user.save();
  }
  return res.status(201).json({ message: "Cửa hàng đã được đăng ký thành công!", store });
});

const checkRegisterStoreName = async (req, res) => {
  const { name } = req.params;

  if (!name) {
    return res.status(400).json({ message: "Tên cửa hàng là bắt buộc." });
  }
  const existingStore = await Store.findOne({ name: name.trim() });
  if (existingStore) {
    return res.status(400).json({ message: "Tên cửa hàng đã tồn tại!" });
  }
  return res.status(200).json({ message: "Tên cửa hàng có thể sử dụng." });
};

const getStoreStats = asyncHandler(async (req, res, next) => {
  try {
    const totalStores = await Store.countDocuments();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const storesThisMonth = await Store.countDocuments({
      createdAt: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    });

    res.status(200).json({
      code: 200,
      message: "Lấy thống kê nhà hàng thành công",
      data: {
        totalStores,
        storesThisMonth,
      },
    });
  } catch (error) {
    next(error);
  }
});

const getPendingStores = asyncHandler(async (req, res, next) => {
  try {
    const pendingStores = await Store.find({ status: "PENDING" })
      .populate("owner", "name email phonenumber")
      .populate("storeCategory", "name");
    res.json(pendingStores);
  } catch (error) {
    next(error);
  }
});

const approveStore = asyncHandler(async (req, res, next) => {
  const { store_id } = req.params;

  try {
    const store = await Store.findByIdAndUpdate(store_id, { status: "APPROVED" }, { new: true });

    if (!store) {
      return next(createError(404, "Cannot find store"));
    }

    res.json({ message: "Store approved", store });
  } catch (error) {
    next(error);
  }
});

const blockedStore = asyncHandler(async (req, res, next) => {
  const { store_id } = req.params;

  try {
    const store = await Store.findByIdAndUpdate(store_id, { status: "BLOCKED" }, { new: true });

    if (!store) {
      return next(createError(404, "Cannot find store"));
    }

    res.json({ message: "Store blocked", store });
  } catch (error) {
    next(error);
  }
});

const getOngoingStores = asyncHandler(async (req, res, next) => {
  try {
    const stores = await Store.find({
      status: { $in: ["APPROVED", "BLOCKED"] },
    })
      .populate("owner", "name email phonenumber")
      .populate("storeCategory", "name");
    res.json(stores);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  checkRegisterStoreName,
  getAllDish,
  getStoreInformation,
  getAllTopping,
  getAllCategory,
  getAllStaff,
  getOrder,
  getAllOrder,
  getDish,
  getTopping,
  getCategory,
  getStaff,
  getAvgRating,
  getAllRating,
  getAllStoreRating,
  getAvgStoreRating,
  getToppingFromDish,
  createToppingGroup,
  addToppingToGroup,
  removeToppingFromGroup,
  deleteToppingGroup,
  addToppingToDish,
  getAllStore,
  updateOrder,
  updateDish,
  createDish,
  createCategory,
  updateCategory,
  deleteCategory,
  updateTopping,
  createStaff,
  updateStaff,
  updateStore,
  registerStore,
  deleteDish,
  addToppingGroup,

  getStoreStats,
  getPendingStores,
  approveStore,
  blockedStore,
  getOngoingStores,
};
