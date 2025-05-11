const express = require("express");
require("dotenv").config();
require("express-async-errors");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const connectDB = require("./shared/connection/db_connection");
const http = require("http");
const socketIo = require("socket.io");
const morgan = require("morgan");
const Notification = require("./shared/model/notification");
const { setSocketIo, getUserSockets, registerUserSocket, unregisterUserSocket, registerStoreSocket, unregisterStoreSocket } = require("./shared/utils/socketManager");

const app = express();
connectDB();

app.use(morgan("dev"));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

setSocketIo(io);

// Connection management
io.on("connection", (socket) => {
  console.log(`New socket connected: ${socket.id}`);

  socket.on("registerUser", async (userId) => {
    try {
      registerUserSocket(userId, socket.id);
      console.log(`User ${userId} registered with socket ID: ${socket.id}`);

      const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
      socket.emit("getAllNotifications", notifications);
    } catch (error) {
      console.error("Error registering user:", error);
    }
  });

  // Listen for "newOrderNotification" and emit to the appropriate users
  socket.on("newOrderNotification", async (data) => {
    try {
      const { userIds, newNotification, newOrder } = data;

      const userSockets = getUserSockets();
      userIds.forEach(uid => {
        const socketId = userSockets[uid];
        if (socketId) {
          io.to(socketId).emit("newOrderNotification", {
            notification: newNotification,
            orderId: newOrder._id,
          });
          console.log("✅ Notification sent to user:", uid);
        } else {
          console.log("⚠️ User not connected or no socket found for user:", uid);
        }
      });
    } catch (error) {
      console.error("Error handling new order notification:", error);
    }
  });

  // Other socket events (chat, store management, etc.)

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (let userId in getUserSockets()) {
      if (getUserSockets()[userId].includes(socket.id)) {
        unregisterUserSocket(userId, socket.id);
        console.log(`User ${userId} disconnected, removed socket ID: ${socket.id}`);
        break;
      }
    }
  });
});

server.listen(process.env.PORT || 5100, () => {
  console.log("Server running on port 5100");
});
