const express = require("express");
require("dotenv").config();
require("express-async-errors");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { errorHandler } = require("./middlewares/errorHandler");
const connectDB = require("./config/connectDB");
const http = require("http");
const socketIo = require("socket.io");
const morgan = require("morgan");
const Notification = require("./services/notification/notification.model");
const authRoute = require("./services/auth/auth.routes");
const userRoute = require("./services/user/user.routes");
const uploadRoute = require("./services/upload/upload.routes");
const notificationRoute = require("./services/notification/notification.routes");
const messageRoute = require("./services/message/message.routes");
const chatRoute = require("./services/chat/chat.routes");
const storeRoute = require("./services/store/store.routes");
const locationRoute = require("./services/location/location.routes");
const cartRoute = require("./services/cart/cart.routes");
const favoriteRoute = require("./services/favorite/favorite.routes");

const app = express();
connectDB();

app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/upload", uploadRoute);
app.use("/api/v1/notification", notificationRoute);
app.use("/api/v1/message", messageRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/store", storeRoute);
app.use("/api/v1/location", locationRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/favorite", favoriteRoute);

app.use(errorHandler);

PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const userSockets = {};

io.on("connection", (socket) => {
  // Nhận user ID từ client khi kết nối
  socket.on("registerUser", async (userId) => {
    userSockets[userId] = socket.id;
    console.log(`User ${userId} connected with socket ID: ${socket.id}`);

    // Khi user kết nối, lấy tất cả thông báo của họ
    try {
      const allNotifications = await Notification.find({ userId }).sort({ createdAt: -1 });
      socket.emit("getAllNotifications", allNotifications); // Gửi về client
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    }
  });

  // Gửi thông báo đến một user cụ thể
  socket.on("sendNotification", async ({ userId, title, message, type }) => {
    try {
      const newNotification = new Notification({ userId, title, message, type });
      await newNotification.save();

      if (userSockets[userId]) {
        io.to(userSockets[userId]).emit("newNotification", newNotification);
      }
    } catch (error) {
      console.error("Lỗi gửi thông báo:", error);
    }
  });

  socket.on("sendLocation", (data) => {
    console.log("Shipper location:", data);
    io.emit("updateLocation", data);
  });

  // Handle message
  socket.on("joinChat", (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on("leaveChat", (room) => {
    socket.leave(room);
    console.log(`User left room: ${room}`);
  });

  socket.on("sendMessage", (newMessageReceived) => {
    io.to(newMessageReceived.id).emit("messageReceived", newMessageReceived);
  });

  socket.on("deleteMessage", (id) => {
    io.to(id).emit("messageDeleted");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    Object.keys(userSockets).forEach((userId) => {
      if (userSockets[userId] === socket.id) {
        delete userSockets[userId];
      }
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
