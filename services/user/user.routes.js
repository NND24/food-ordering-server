const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
  register,
  login,
  logout,
  getRefreshToken,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
} = require("./user.controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password-token", forgotPasswordToken);

router.get("/logout", logout);
router.get("/refresh", getRefreshToken);

router.put("/reset-password/:token", resetPassword);
router.put("/password", authMiddleware, updatePassword);

module.exports = router;
