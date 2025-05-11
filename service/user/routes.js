const express = require("express");
const authMiddleware = require("./shared/middlewares/authMiddleware");
const validateMongoDbId = require("./shared/middlewares/validateMongoDBId");
const { verifyToken } = require("./shared/middlewares/authMiddlewareAdmin");
const { getAllUser, getUser, updateUser, deleteUser, getUserStats } = require("./controller");

const router = express.Router();

router.get("/stats", verifyToken, getUserStats);
router.get("/", getAllUser);
router.get("/:id", validateMongoDbId("id"), getUser);

router.put("/", authMiddleware, updateUser);

router.delete("/", authMiddleware, deleteUser);

module.exports = router;
