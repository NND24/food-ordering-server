const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMongoDbId = require("../../middlewares/validateMongoDBId");
const { getAllUser, getUser, updateUser, deleteUser } = require("./user.controller");

const router = express.Router();

router.get("/", authMiddleware, getAllUser);
router.get("/:id", validateMongoDbId("id"), getUser);

router.put("/", authMiddleware, updateUser);

router.delete("/", authMiddleware, deleteUser);

module.exports = router;
