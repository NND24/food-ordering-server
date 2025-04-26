const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const { updateNotification, getNotifications, getStoreNotifications } = require("./notification.controller");
const Notification = require("./notification.model");
const { getSocketIo, getUserSockets } = require("../../utils/socketManager");

const router = express.Router();

router.get("/get-all-notifications", authMiddleware, getNotifications);

router.put("/update-notification/:id", authMiddleware, updateNotification);

router.get("/get-all-notifications/store/:store_id", authMiddleware, getStoreNotifications);

// For testing purposes, you can create a notification directly
router.post("/create-notification", async (req, res) => {
    try {
        const { title, message, user_id } = req.body;
        const notification = await Notification.create({
            title,
            message,
            userId: user_id,
            status: "unread",
            type: "order",
        });
        const io = getSocketIo();
        const userSockets = getUserSockets();
        // console.log("userSockets", userSockets);
        // console.log("io", io);

        // Get socket.io instance and emit to each connected user
        Object.values(userSockets).forEach(socketId => {
            if (socketId) {
                io.to(socketId).emit("newOrderNotification", {
                    notification: notification,
                    orderId: "orderId",
                });
                console.log("✅ Notification sent to socket:", socketId);
            } else {
                console.log("⚠️ No socket ID found");
            }
        });
        res.status(201).json(notification);
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ error: "Failed to create notification" });
    }
});

module.exports = router;
