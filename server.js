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
const shipperRoute = require("./services/shipper/shipper.routes");
const foodTypeRoute = require("./services/foodType/foodType.routes");
const employeeRoute = require("./services/employee/employee.routes");
const cartRoute = require("./services/cart/cart.routes");
const favoriteRoute = require("./services/favorite/favorite.routes");
const orderRoute = require("./services/order/order.routes");
const ratingRoute = require("./routes/rating.route");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
connectDB();

app.use(morgan("dev"));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

PORT = process.env.PORT || 5000;

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "My API",
    version: "1.0.0",
    description: "Example Express API with autogenerated Swagger doc",
  },
  servers: [
    {
      url: `http://localhost:${PORT}`, // URL server backend
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./services/**/*.routes.js"], // đường dẫn chứa comment swagger
};

const swaggerSpec = swaggerJsdoc(options);

// Route Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});
// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/upload", uploadRoute);
app.use("/api/v1/notification", notificationRoute);
app.use("/api/v1/message", messageRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/store", storeRoute);
app.use("/api/v1/location", locationRoute);
app.use("/api/v1/shipper", shipperRoute);
app.use("/api/v1/foodType", foodTypeRoute);
app.use("/api/v1/employee", employeeRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/favorite", favoriteRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/rating", ratingRoute);

app.use(errorHandler);

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const userSockets = {};

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

  socket.on("sendMessage", (newMessageReceived) => {
    io.to(newMessageReceived.id).emit("messageReceived", newMessageReceived);
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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
