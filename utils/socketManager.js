// utils/socketManager.js

let io = null;
const userSockets = {};

function setSocketIo(socketInstance) {
  io = socketInstance;
}

function getSocketIo() {
  return io;
}

function getUserSockets() {
  return userSockets;
}

module.exports = {
  setSocketIo,
  getSocketIo,
  getUserSockets,
};
