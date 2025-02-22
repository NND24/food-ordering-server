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
const authRoute = require("./services/auth/auth.routes");
const userRoute = require("./services/user/user.routes");
const uploadRoute = require("./services/upload/upload.routes");

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

app.use(errorHandler);

PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "http://localhost:3000" } });

io.on("connection", (socket) => {
  console.log("Shipper connected:", socket.id);

  socket.on("updateLocation", (data) => {
    console.log("Shipper location:", data);
    io.emit("updateLocation", data);
  });

  socket.on("disconnect", () => {
    console.log("Shipper disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
