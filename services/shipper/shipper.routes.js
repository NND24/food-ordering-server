const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMongoDbId = require("../../middlewares/validateMongoDBId");
const { getAllShippers, getShipper, updateShipper, deleteShipper, approveShipper, blockShipper } = require("./shipper.controller");

const router = express.Router();

router.get("/", getAllShippers);
router.get("/:id", validateMongoDbId("id"), getShipper);

router.put("/", authMiddleware, updateShipper);

router.delete("/", authMiddleware, deleteShipper);

router.patch("/:id/approve", authMiddleware, approveShipper);
router.patch("/:id/block", authMiddleware, blockShipper);

module.exports = router;
