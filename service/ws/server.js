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
const Chat = require("./shared/model/chat");
const {
  setSocketIo,
  getUserSockets,
  registerUserSocket,
  unregisterUserSocket,
  registerStoreSocket,
  unregisterStoreSocket,
} = require("./shared/utils/socketManager");

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
const userSockets = getUserSockets();

// Connection management
io.on("connection", (socket) => {
  socket.on("registerUser", async (userId) => {
    // Nếu userId chưa có trong userSockets, tạo mảng mới
    if (!userSockets[userId]) {
      userSockets[userId] = [];
    }

    // Thêm socket id vào mảng của user
    userSockets[userId].push(socket.id);

    console.log(`User ${userId} connected with socket ID: ${socket.id}`);

    // Khi user kết nối, lấy tất cả thông báo của họ
    try {
      const allNotifications = await Notification.find({ userId }).sort({ createdAt: -1 });
      socket.emit("getAllNotifications", allNotifications); // Gửi về client
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    }
  });

  // Gửi thông báo đến tất cả các thiết bị của một user
  socket.on("sendNotification", async ({ userId, title, message, type }) => {
    try {
      const newNotification = new Notification({ userId, title, message, type });
      await newNotification.save();

      // Gửi thông báo đến tất cả các socket ids của userId
      if (userSockets[userId]) {
        userSockets[userId].forEach((socketId) => {
          io.to(socketId).emit("newNotification", newNotification);
        });
      }
    } catch (error) {
      console.error("Lỗi gửi thông báo:", error);
    }
  });
  
  socket.on("orderPlaced", async (data) => {
    try {
      const { userIds, order, notification, userId } = data;
      
      console.log({
        _id: notification.id,
        notification: notification,
        orderId: order.id,
        title: "New Order place",
        message: "You got new order",
        type: "order",
        userId: userId,
        status: "unread"
      })

      // Send notification to each connected user
      userIds.forEach((uid) => {
        const socketId = getUserSockets()[uid];
        if (socketId) {
          io.to(socketId).emit("newOrderNotification", {
            _id: notification.id,
            notification: notification,
            orderId: order.id,
            title: "New Order place",
            message: "You got new order",
            type: "order",
            userId: userId,
            status: "unread"
          });
          console.log("✅ Notification sent to user:", uid);
        } else {
          console.log("⚠️ User not connected or no socket found for user:", uid);
        }
      });
    } catch (err) {
      console.error("Error sending order notification:", err.message);
    }
  });

  // Handle send location
  socket.on("joinOrder", (orderId) => {
    socket.join(orderId);
    console.log(`User joined order: ${orderId}`);
  });

  socket.on("leaveOrder", (orderId) => {
    socket.leave(orderId);
    console.log(`User left order: ${orderId}`);
  });

  socket.on("sendLocation", (locationData) => {
    console.log("Shipper location:", locationData.data);
    io.to(locationData.id).emit("updateLocation", locationData.data);
  });

  // Handle message
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined room: ${chatId}`);
  });

  socket.on("leaveChat", (chatId) => {
    socket.leave(chatId);
    console.log(`User left room: ${chatId}`);
  });

  // socket.on("sendMessage", (newMessageReceived) => {
  //   io.to(newMessageReceived.id).emit("messageReceived", newMessageReceived);
  //   io.to(`store:${message.storeId}`).emit("storeNewMessage", message);
  // });

  socket.on("sendMessage", async (newMessageReceived) => {
    console.log("New message received:", newMessageReceived);

    const chatId = newMessageReceived.id;

    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        console.error("Chat not found for ID:", chatId);
        return;
      }
      console.log("Chat found:", chat);

      if (chat.store) {
        const storeId = chat.store.toString();

        // Emit message to user(s) in that chat room
        io.to(chatId).emit("messageReceived", newMessageReceived);

        // Emit notification to the store room
        if (storeId) {
          console.log("Store ID found:", storeId);
          io.to(`store:${storeId}`).emit("storeNewMessage", newMessageReceived);
        }
      }

      io.to(chatId).emit("messageReceived", newMessageReceived);
    } catch (error) {
      console.error("Error in sendMessage:", error);
    }
  });

  socket.on("joinStoreRoom", (storeId) => {
    socket.join(`store:${storeId}`);
    console.log(`Store ${storeId} joined room store:${storeId}`);
  });

  socket.on("deleteMessage", (id) => {
    console.log("deleteMessage: ", id);
    io.to(id).emit("messageDeleted");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (let userId in userSockets) {
      const socketIndex = userSockets[userId].indexOf(socket.id);
      if (socketIndex !== -1) {
        userSockets[userId].splice(socketIndex, 1);
        console.log(`User ${userId} disconnected, removed socket ID: ${socket.id}`);
        break;
      }
    }
  });
});

server.listen(process.env.PORT || 5100, () => {
  console.log("Server running on port 5100");
});
