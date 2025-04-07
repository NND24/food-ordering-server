const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMongoDbId = require("../../middlewares/validateMongoDBId");
const { verifyToken } = require("../../middlewares/authMiddlewareAdmin");
const { getAllUser, getUser, updateUser, deleteUser, getUserStats } = require("./user.controller");

const router = express.Router();

router.get("/stats", verifyToken, getUserStats);
router.get("/", getAllUser);
router.get("/:id", validateMongoDbId("id"), getUser);

router.put("/", authMiddleware, updateUser);

router.delete("/", authMiddleware, deleteUser);

module.exports = router;
