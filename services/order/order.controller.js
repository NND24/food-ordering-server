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

module.exports = { getUserOrder, getOrderDetail };
