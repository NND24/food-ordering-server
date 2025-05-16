const { io } = require("socket.io-client");

const socket = io( process.env.WEBSOCKET_PORT ? "http://ws:"+ process.env.WEBSOCKET_PORT : "http://ws:5100" , {
  transports: ["websocket"],
  reconnectionAttempts: 3,
});

socket.on("connect", () => {
  console.log("Connected to WebSocket service");
});

socket.on("connect_error", (error) => {
  console.error("WebSocket connection error:", error);
});

module.exports = socket;
