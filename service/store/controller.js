const Category = require("./shared/model/category");
const FoodType = require("./shared/model/foodType");
const ToppingGroup = require("./shared/model/toppingGroup");
const Topping = require("./shared/model/topping");
const Store = require("./shared/model/store");
const Rating = require("./shared/model/rating");
const Dish = require("./shared/model/dish");
const Order = require("./shared/model/order");

const createError = require("./shared/utils/createError");
const asyncHandler = require("express-async-handler");

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
const getAllStore = async (req, res) => {
  try {
    const { name, category, sort, limit, page, lat, lon } = req.query;
    let filterOptions = {};
    if (name) filterOptions.name = { $regex: name, $options: "i" };
    if (category) {
      const categories = Array.isArray(category)
        ? category
        : category.split(",");
      filterOptions.storeCategory = { $in: categories };
    }

    // Fetch all stores first
    let stores = await Store.find(filterOptions)
      .populate("storeCategory")
      .lean();

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
      const rating = storeRatings.find(
        (r) => r._id.toString() == store._id.toString()
      );
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
          Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
      };

      // Sau khi tính khoảng cách
      stores = stores.map((store) => {
        if (store.address?.lat != null && store.address?.lon != null) {
          store.distance = calculateDistance(
            latUser,
            lonUser,
            store.address.lat,
            store.address.lon
          );
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
      const storeOrders = await Order.aggregate([
        { $group: { _id: "$store", orderCount: { $sum: 1 } } },
      ]);
      stores = stores
        .map((store) => {
          const order = storeOrders.find(
            (o) => o._id.toString() == store._id.toString()
          );
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
      const paginatedStores = stores.slice(
        (pageNumber - 1) * pageSize,
        pageNumber * pageSize
      );

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
const approveStore = asyncHandler(async (req, res, next) => {
  const { store_id } = req.params;

  try {
    const store = await Store.findByIdAndUpdate(
      store_id,
      { status: "APPROVED" },
      { new: true }
    );

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
    const store = await Store.findByIdAndUpdate(
      store_id,
      { status: "BLOCKED" },
      { new: true }
    );

    if (!store) {
      return next(createError(404, "Cannot find store"));
    }

    res.json({ message: "Store blocked", store });
  } catch (error) {
    next(error);
  }
});
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
    const amountRating =
      storeRatings.length > 0 ? storeRatings[0].amountRating : 0;

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
const registerStore = asyncHandler(async (req, res) => {
  const { owner, email, password, name, description, foodType, address } =
    req.body;
  let user = null;

  if (!name?.trim() || !address.full_address.trim()) {
    return res
      .status(400)
      .json({ message: "Tên cửa hàng và địa chỉ là bắt buộc." });
  }
  if (!address.lat || !address.lon) {
    return res
      .status(400)
      .json({ message: "Vui lòng cung cấp tọa độ địa chỉ." });
  }
  if (!owner) {
    // Kiểm tra xem người dùng có phải người dùng mới không
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email và mật khẩu là bắt buộc." });
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
    return res
      .status(400)
      .json({ message: "Người đăng ký đã sở hữu cửa hàng." });
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
  return res
    .status(201)
    .json({ message: "Cửa hàng đã được đăng ký thành công!", store });
});
const updateStore = async (req, res) => {
  try {
    const { store_id } = req.params;
    const updates = req.body;

    if (!store_id || !updates) {
      return res
        .status(400)
        .json({ message: "Store ID and updates are required." });
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

  res
    .status(200)
    .json({ message: "Thông tin nhân viên đã được cập nhật", staff });
});

module.exports = {
  getStoreStats,
  getPendingStores,
  getOngoingStores,
  getAllStore,
  approveStore,
  blockedStore,
  getStoreInformation,
  registerStore,
  updateStore,
  checkRegisterStoreName,
  getAllStaff,
  getStaff,
  createStaff,
  updateStaff,
};
