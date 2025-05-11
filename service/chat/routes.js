const express = require("express");
const authMiddleware = require("./shared/middlewares/authMiddleware");
const validateMongoDbId = require("./shared/middlewares/validateMongoDBId");
const { createChat, getAllChats, deleteChat, createStoreChat } = require("./controller");

const router = express.Router();

router.post("/:id", authMiddleware, validateMongoDbId("id"), createChat);
router.post("/:id/store/:storeId", authMiddleware, validateMongoDbId("id"), createStoreChat);
router.get("/", authMiddleware, getAllChats);
router.delete("/delete/:id", authMiddleware, deleteChat);

module.exports = router;
