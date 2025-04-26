const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMongoDbId = require("../../middlewares/validateMongoDBId");
const { createChat, getAllChats, deleteChat, createStoreChat } = require("./chat.controller");

const router = express.Router();

router.post("/:id", authMiddleware, validateMongoDbId("id"), createChat);
router.post("/:id/store/:storeId", authMiddleware, validateMongoDbId("id"), createStoreChat);

router.get("/", authMiddleware, getAllChats);

router.delete("/delete/:id", authMiddleware, deleteChat);

module.exports = router;
