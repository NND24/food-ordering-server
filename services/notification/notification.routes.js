const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const { updateNotification, getNotifications } = require("./notification.controller");

const router = express.Router();

router.get("/get-all-notifications", authMiddleware, getNotifications);

router.put("/update-notification/:id", authMiddleware, updateNotification);

module.exports = router;
