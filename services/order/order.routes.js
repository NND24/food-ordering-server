const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMongoDbId = require("../../middlewares/validateMongoDBId");
const {
  getUserOrder,
  getOrderDetail,
  getFinishedOrders,
  acceptOrder,
  getOnGoingOrder,
  updateOrderStatus,
  getDeliveredOrders,
} = require("./order.controller");
const router = express.Router();

router.get("/", authMiddleware, getUserOrder);
router.get("/finished", authMiddleware, getFinishedOrders);
router.get("/taken", authMiddleware, getOnGoingOrder);
router.get("/delivered", authMiddleware, getDeliveredOrders);
router.get(
  "/:orderId",
  authMiddleware,
  validateMongoDbId("orderId"),
  getOrderDetail
);
router.put("/:orderId/accept", authMiddleware, acceptOrder);
router.put("/:orderId/update-status", authMiddleware, updateOrderStatus);

module.exports = router;