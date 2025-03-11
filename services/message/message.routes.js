const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMongoDbId = require("../../middlewares/validateMongoDBId");
const { sendMessage, getAllMessages, deleteMessage } = require("./message.controller");

const router = express.Router();

router.post("/:id", authMiddleware, validateMongoDbId("id"), sendMessage);

router.get("/:id", authMiddleware, validateMongoDbId("id"), getAllMessages);

router.delete("/delete/:id", authMiddleware, validateMongoDbId("id"), deleteMessage);

module.exports = router;
