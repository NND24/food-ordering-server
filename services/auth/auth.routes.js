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
  googleLoginWithToken,
} = require("./auth.controller");

const router = express.Router();

router.post("/register", register);
router.post("/forgot-password-token", forgotPasswordToken);
router.post("/login", login);
router.post("/login/google", googleLoginWithToken);

router.get("/logout", logout);
router.get("/refresh", getRefreshToken);

router.put("/reset-password/:token", resetPassword);
router.put("/password", authMiddleware, updatePassword);

module.exports = router;
