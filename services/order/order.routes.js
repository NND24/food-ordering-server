const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMongoDbId = require("../../middlewares/validateMongoDBId");

const { verifyToken } = require("../../middlewares/authMiddlewareAdmin");
const {
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
} = require("./order.controller");
const router = express.Router();
router.get("/monthly-stats", verifyToken, getMonthlyOrderStats);
router.get("/", authMiddleware, getUserOrder);
router.get("/finished", authMiddleware, getFinishedOrders);
router.get("/taken", authMiddleware, getOnGoingOrder);
router.get("/delivered", authMiddleware, getDeliveredOrders);
router.get("/stats", verifyToken, getOrderStats);
router.get(
  "/:orderId",
  authMiddleware,
  validateMongoDbId("orderId"),
  getOrderDetail
);

router.get(
  "/shipper/:shipperId",
  validateMongoDbId("shipperId"),
  getShipperOrders
);
router.put("/:orderId/accept", authMiddleware, acceptOrder);
router.put("/:orderId/update-status", authMiddleware, updateOrderStatus);

module.exports = router;
