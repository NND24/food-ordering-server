const express = require("express");
const authMiddleware = require("./shared/middlewares/authMiddleware");
const validateMongoDbId = require("./shared/middlewares/validateMongoDBId");

const { verifyToken, authorizeStoreStaff } = require("./shared/middlewares/authMiddlewareAdmin");
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
  cancelOrder,
  getOrderDetailForDirectionShipper,
  getAllOrder,
  updateOrder,
  getOrderDetailForStore
} = require("./controller");
const router = express.Router();
router.get("/monthly-stats", verifyToken, getMonthlyOrderStats);
router.get("/", authMiddleware, getUserOrder);
router.get("/finished", authMiddleware, getFinishedOrders);
router.get("/taken", authMiddleware, getOnGoingOrder);
router.get("/delivered", authMiddleware, getDeliveredOrders);
router.get("/stats", verifyToken, getOrderStats);
router.get("/direction/:orderId", authMiddleware, validateMongoDbId("orderId"), getOrderDetailForDirectionShipper);
router.get("/:orderId", authMiddleware, validateMongoDbId("orderId"), getOrderDetail);
router.get("/:orderId/store", authMiddleware, validateMongoDbId("orderId"), getOrderDetailForStore)

router.get("/shipper/:shipperId", validateMongoDbId("shipperId"), getShipperOrders);
router.put("/:orderId/accept", authMiddleware, acceptOrder);
router.put("/:orderId/update-status", authMiddleware, updateOrderStatus);
router.put("/:orderId/cancel-order", authMiddleware, cancelOrder);

router.get("/store/:store_id", verifyToken, authorizeStoreStaff(["owner", "staff", "manager"]), getAllOrder); // CHECK
router.put("/:order_id", verifyToken, authorizeStoreStaff(["owner", "staff", "manager"]), updateOrder);

module.exports = router;
