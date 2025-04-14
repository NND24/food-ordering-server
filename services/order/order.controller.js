const Order = require("./order.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");

const getUserOrder = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;
  if (!userId) {
    next(
      createError(400, {
        success: false,
        message: "User not found",
      })
    );
  }

  const orders = await Order.find({ user: userId })
    .populate({
      path: "store",
    })
    .populate("items.dish")
    .populate("items.toppings")
    .populate("shipper")
    .sort({ updatedAt: -1 });

  if (!orders || orders.length === 0) {
    next(
      createError(404, {
        success: false,
        message: "Order not found",
      })
    );
  }

  res.status(200).json({
    success: true,
    data: orders,
  });
});

const getOrderDetail = asyncHandler(async (req, res, next) => {
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
    .populate("shipper");

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
  const finishedOrders = await Order.find({ status: "finished" })
    .populate({ path: "store" })
    .populate("items.dish")
    .populate("items.toppings")
    .populate({ path: "user" })
    .sort({ updatedAt: -1 });

  if (!finishedOrders || finishedOrders.length === 0) {
    return next(
      createError(404, {
        success: false,
        message: "No finished orders found",
      })
    );
  }

  res.status(200).json({
    success: true,
    count: finishedOrders.length,
    data: finishedOrders,
  });
});

const acceptOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const shipperId = req?.user?._id;

  console.log("🚀 Shipper ID:", shipperId);
  console.log("🚀 Order ID:", orderId);

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

  const order = await Order.findById(orderId);

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
  }).populate("store", "name address avatar");

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

  const order = await Order.findById(orderId);
  if (!order) {
    return next(createError(404, "Order not found"));
  }

  order.status = status;
  await order.save();

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    data: order,
  });
});

const getDeliveredOrders = asyncHandler(async (req, res, next) => {
  const shipperId = req?.user?._id;

  if (!shipperId) {
    return next(createError(400, { success: false, message: "Shipper not found" }));
  }

  try {
    // Lấy `page` và `limit` từ query params (mặc định page = 1, limit = 5)
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 5;
    const skip = (page - 1) * limit; // Tính offset

    // Lấy tổng số đơn hàng đã giao
    const totalOrders = await Order.countDocuments({
      shipper: shipperId,
      status: "done",
    });

    // Lấy danh sách đơn hàng theo phân trang
    const deliveredOrders = await Order.find({
      shipper: shipperId,
      status: "done",
    })
      .populate("store")
      .populate("items.dish")
      .populate("items.toppings")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      data: deliveredOrders,
    });
  } catch (error) {
    next(createError(500, { success: false, message: "Server error", error }));
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
      status: "finished",
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
};
