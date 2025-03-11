const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMongoDbId = require("../../middlewares/validateMongoDBId");
const { getUserOrder, getOrderDetail } = require("./order.controller");
const router = express.Router();

router.get("/", authMiddleware, getUserOrder);
router.get("/:orderId", authMiddleware, validateMongoDbId("orderId"), getOrderDetail);

module.exports = router;
