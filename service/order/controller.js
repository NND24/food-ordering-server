const Store = require("./shared/model/store");
const Topping = require("./shared/model/topping");
const Dish = require("./shared/model/dish");
const Order = require("./shared/model/order");
const FoodType = require("./shared/model/foodType");
const Cart = require("./shared/model/cart");
const ToppingGroup = require("./shared/model/toppingGroup");
const Rating = require("./shared/model/rating");
const Notification = require("./shared/model/notification");
const createError = require("./shared/utils/createError");
const asyncHandler = require("express-async-handler");
const { getPaginatedData } = require("./shared/utils/paging");
const mongoose = require("mongoose");

const getUserOrder = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;
  if (!userId) {
    const error = new Error("User not found");
    error.status = 400;
    return next(error);
  }

  let orders = await Order.find({ user: userId })
    .populate("store")
    .populate("items.dish")
    .populate("items.toppings")
    .populate("shipper")
    .sort({ updatedAt: -1 });

  // ✅ Lọc trước
  orders = orders.filter((order) => order.store?.status === "APPROVED");

  // ✅ Kiểm tra sau khi lọc
  if (!orders || orders.length === 0) {
    const error = new Error("Order not found");
    error.status = 404;
    return next(error);
  }

  return res.status(200).json({
    success: true,
    data: orders,
  });
});

const getOrderDetail = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  if (!orderId) {
    return next(createError(400, "orderId not found"));
  }

  const orderDetail = await Order.findById(orderId)
    .populate("store")
    .populate("items.dish")
    .populate("items.toppings")
    .populate("shipper");

  if (!orderDetail) {
    return next(createError(404, "Order not found"));
  }

  return res.status(200).json({
    success: true,
    data: orderDetail,
  });
});

const getOrderDetailForStore = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Truy vấn danh sách món ăn
    const order = await Order.findById(orderId).populate([
      { path: "store", select: "name" }, // Include store details
      { path: "user", select: "name email avatar" }, // Include user details
      { path: "items.dish", select: "name price" }, // Include dish details
      { path: "items.toppings", select: "name price" }, // Include toppings details
      { path: "shipper" },
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

const getOrderDetailForDirectionShipper = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  if (!orderId) {
    next(
      createError(400, {
        success: false,
        message: "orderId not found",
      })
    );
  }

  const orderDetail = await Order.findById(orderId)
    .populate({
      path: "store",
    })
    .populate("items.dish")
    .populate("items.toppings")
    .populate({ path: "user" });

  if (!orderDetail || orderDetail.length === 0) {
    next(
      createError(404, {
        success: false,
        message: "Order not found",
      })
    );
  }

  res.status(200).json({
    success: true,
    data: orderDetail,
  });
});

const getFinishedOrders = asyncHandler(async (req, res, next) => {
  try {
    const finishedOrders = await Order.find({ status: "finished" })
      .populate({ path: "store" })
      .populate("items.dish")
      .populate("items.toppings")
      .populate({ path: "user" })
      .sort({ updatedAt: -1 });

    if (!finishedOrders || finishedOrders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Không có đơn hàng nào đã hoàn tất.",
        count: 0,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn hàng đã hoàn tất thành công.",
      count: finishedOrders.length,
      data: finishedOrders,
    });
  } catch (err) {
    return next(
      createError(500, {
        success: false,
        message: "Đã xảy ra lỗi khi lấy đơn hàng.",
        error: err.message,
      })
    );
  }
});

const acceptOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const shipperId = req?.user?._id;

  if (!orderId) {
    return next(
      createError(400, {
        success: false,
        message: "orderId not found",
      })
    );
  }

  if (!shipperId) {
    return next(
      createError(400, {
        success: false,
        message: "Shipper not found",
      })
    );
  }

  // 🔹 Kiểm tra shipper có đơn hàng đang giao không
  const existingOrder = await Order.findOne({
    shipper: shipperId,
    status: { $in: ["taken", "delivering", "delivered"] }, // Đơn đang được giao
  });

  if (existingOrder) {
    return next(
      createError(409, {
        success: false,
        errorCode: "ORDER_ALREADY_ASSIGNED",
        message: "Bạn đang giao một đơn hàng khác, không thể nhận thêm!",
      })
    );
  }

  const order = await Order.findById(orderId)
    .populate({ path: "store" })
    .populate("items.dish")
    .populate("items.toppings")
    .populate({ path: "user" });

  if (!order) {
    return next(
      createError(404, {
        success: false,
        message: "Order not found",
      })
    );
  }

  if (order.status !== "finished") {
    return next(
      createError(400, {
        success: false,
        message: "Order has already been taken or is being processed",
      })
    );
  }

  order.status = "taken";
  order.shipper = shipperId;

  await order.save();

  res.status(200).json({
    success: true,
    message: "Order accepted successfully",
    data: order,
  });
});

const getOnGoingOrder = asyncHandler(async (req, res, next) => {
  const shipperId = req?.user?._id;

  if (!shipperId) {
    return next(
      createError(400, {
        success: false,
        message: "Shipper not found",
      })
    );
  }

  const takenOrder = await Order.findOne({
    shipper: shipperId,
    status: { $in: ["taken", "delivering", "delivered"] },
  })
    .populate({ path: "store" })
    .populate("items.dish")
    .populate("items.toppings")
    .populate({ path: "user" });

  if (!takenOrder) {
    return res.status(404).json({
      success: false,
      message: "Không có đơn hàng nào đang giao.",
    });
  }

  res.status(200).json({
    success: true,
    data: takenOrder,
  });
});

const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await Order.findById(orderId)
    .populate({ path: "store" })
    .populate("items.dish")
    .populate("items.toppings")
    .populate({ path: "user" });

  if (!order) {
    return next(createError(404, "Order not found"));
  }

  const currentStatus = order.status;

  // Validate status transitions
  const validTransitions = {
    taken: ["delivering", "finished"],
    delivering: ["delivered"],
    delivered: ["done"],
  };

  if (status === currentStatus) {
    return next(createError(400, `Order is already in '${status}' status.`));
  }

  if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
    return next(createError(400, `Cannot change status from '${currentStatus}' to '${status}'.`));
  }

  order.status = status;
  await order.save();

  res.status(200).json({
    success: true,
    message: `Order status updated to '${status}' successfully`,
    data: order,
  });
});

const cancelOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  const order = await Order.findById(orderId);
  if (!order) {
    return next(createError(404, "Order not found"));
  }

  if (order.user.toString() !== userId.toString()) {
    return next(createError(403, "You are not authorized to cancel this order"));
  }

  const cancellableStatuses = ["preorder", "pending"];

  if (cancellableStatuses.includes(order.status)) {
    await Order.findByIdAndDelete(orderId);

    res.status(200).json({
      success: true,
      message: "Order has been cancelled and deleted successfully",
    });
  } else {
    res.status(409).json({
      success: false,
      message: `Cannot cancel an order with status '${order.status}'. Only pending orders can be cancelled.`,
    });
  }
});

const getDeliveredOrders = asyncHandler(async (req, res, next) => {
  const shipperId = req?.user?._id;

  if (!shipperId) {
    return next(createError(400, { success: false, message: "Shipper not found" }));
  }

  try {
    // Lấy `page` và `limit` từ query params (mặc định page = 1, limit = 5)
    let { page, limit, all } = req.query;
    const isGetAll = all === "true";

    if (!isGetAll) {
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 5;
    }

    const filter = {
      shipper: shipperId,
      status: "done",
    };

    // Đếm tổng số đơn hàng
    const totalOrders = await Order.countDocuments(filter);

    // Truy vấn danh sách đơn hàng
    let query = Order.find(filter)
      .populate({ path: "store" })
      .populate("items.dish")
      .populate("items.toppings")
      .populate({ path: "user" })
      .sort({ updatedAt: -1 });

    if (!isGetAll) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    const deliveredOrders = await query;

    res.status(200).json({
      success: true,
      page: isGetAll ? 1 : page,
      totalPages: isGetAll ? 1 : Math.ceil(totalOrders / limit),
      totalOrders,
      data: deliveredOrders,
    });
  } catch (error) {
    next(
      createError(500, {
        success: false,
        message: "Server error",
        error: error.message,
      })
    );
  }
});

const getShipperOrders = asyncHandler(async (req, res, next) => {
  try {
    const { shipperId } = req.params;
    if (!shipperId) {
      return next(createError(400, "Shipper ID không hợp lệ"));
    }

    // Lấy tất cả đơn hàng của shipper này
    const allOrders = await Order.find({
      shipper: shipperId,
      status: "done",
    });

    // Lọc ra đơn hàng của tháng hiện tại
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const ordersThisMonth = allOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() + 1 === currentMonth && orderDate.getFullYear() === currentYear;
    });

    res.status(200).json({
      success: true,
      totalOrders: allOrders.length, // Tổng số đơn hàng shipper đã nhận
      monthlyOrders: ordersThisMonth.length, // Số đơn hàng trong tháng này
    });
  } catch (error) {
    next(createError(500, "Lỗi khi lấy dữ liệu đơn hàng của shipper"));
  }
});

const getOrderStats = asyncHandler(async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();

    // Lấy thời gian đầu và cuối của tháng hiện tại
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const ordersThisMonth = await Order.countDocuments({
      createdAt: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    });

    res.status(200).json({
      code: 200,
      message: "Lấy thống kê đơn hàng thành công",
      data: {
        totalOrders,
        ordersThisMonth,
      },
    });
  } catch (error) {
    next(error);
  }
});

const getMonthlyOrderStats = asyncHandler(async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id",
          total: 1,
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Chuyển thành array đủ 12 tháng
    const fullStats = Array.from({ length: 12 }, (_, i) => {
      const stat = stats.find((s) => s.month === i + 1);
      return {
        name: `Tháng ${i + 1}`,
        total: stat ? stat.total : 0,
      };
    });

    res.status(200).json({
      code: 200,
      message: "Lấy thống kê đơn hàng theo tháng thành công",
      data: fullStats,
    });
  } catch (error) {
    next(error);
  }
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

const reOrder = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const { storeId, items } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (!storeId) {
      return res.status(400).json({ success: false, message: "Invalid request body" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items cannot be empty" });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    // 👉 Check nếu cửa hàng bị BLOCKED thì không cho reorder
    if (store.status === "BLOCKED") {
      return res.status(403).json({ success: false, message: "Cannot reorder from a blocked store" });
    }

    isHasOutOfStockDish = false;
    items.map((item) => {
      if (item.dish.stockStatus === "OUT_OF_STOCK") {
        isHasOutOfStockDish = true;
      }
    });

    if (isHasOutOfStockDish) {
      return res.status(403).json({ success: false, message: "Order has out of stock dish" });
    }

    let cart = await Cart.findOne({ user: userId, store: storeId });

    if (cart) {
      cart.items = items;
      await cart.save();

      return res.status(200).json({
        success: true,
        message: "ReOrder updated successfully",
        cart,
      });
    } else {
      const newCart = await Cart.create({
        user: userId,
        store: storeId,
        items,
      });

      return res.status(201).json({
        success: true,
        message: "ReOrder successfully",
        cart: newCart,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const addStoreRating = asyncHandler(async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const userId = req.user?._id;
    const { dishes, ratingValue, comment, images } = req.body;

    await Rating.create({
      user: userId,
      store: storeId,
      dishes,
      ratingValue,
      comment,
      images,
    });

    res.status(201).json("Add rating successfully");
  } catch (error) {
    next(createError(500, error.message));
  }
});

module.exports = {
  getUserOrder,
  getOrderDetail,
  getFinishedOrders,
  acceptOrder,
  getOnGoingOrder,
  updateOrderStatus,
  getDeliveredOrders,
  getShipperOrders,
  getOrderStats,
  getMonthlyOrderStats,
  cancelOrder,
  getOrderDetailForDirectionShipper,
  getAllOrder,
  updateOrder,
  getOrderDetailForStore,
  reOrder,
  addStoreRating,
};
