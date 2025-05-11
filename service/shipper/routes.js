const express = require("express");
const authMiddleware = require("./shared/middlewares/authMiddleware");
const {authorize, verifyToken} = require("./shared/middlewares/authMiddlewareAdmin")
const validateMongoDbId = require("./shared/middlewares/validateMongoDBId");
const {
  getAllShippers,
  getShipper,
  updateShipper,
  deleteShipper,
  approveShipper,
  blockShipper,
  verifyOldPassword,
  resetPassword,
  getPendingShippers,
  getCurrentShippers,
  getShipperStats
} = require("./controller");

const router = express.Router();
router.get("/stats", verifyToken, getShipperStats);
router.get("/", getAllShippers);
router.get("/pending", getPendingShippers);
router.get("/current", getCurrentShippers);
router.get("/:id", validateMongoDbId("id"), getShipper);

router.put("/", authMiddleware, updateShipper);

router.delete("/:id", verifyToken, authorize(["ADMIN", "SHIPPER"]), deleteShipper);
router.post("/verify-password", authMiddleware, verifyOldPassword);
router.put("/reset-password", authMiddleware, resetPassword);

router.patch("/:id/approve", verifyToken, authorize(["ADMIN", "SHIPPER"]), approveShipper);
router.patch("/:id/block", verifyToken, authorize(["ADMIN", "SHIPPER"]), blockShipper);

module.exports = router;
