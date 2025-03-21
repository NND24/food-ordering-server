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
    .populate("items.toppings");

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

module.exports = {
  getUserOrder,
  getOrderDetail,
  getFinishedOrders,
  acceptOrder,
  getOnGoingOrder,
  updateOrderStatus,
};
