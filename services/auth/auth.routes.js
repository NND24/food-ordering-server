const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
  register,
  login,
  logout,
  getRefreshToken,
  changePassword,
  resetPassword,
  forgotPassword,
  checkOTP,
  googleLoginWithToken,
} = require("./auth.controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/login/google", googleLoginWithToken);
router.post("/forgot-password", forgotPassword);
router.post("/check-otp", checkOTP);

router.get("/logout", logout);
router.get("/refresh", getRefreshToken);

router.put("/change-password", authMiddleware, changePassword);
router.put("/reset-password", resetPassword);

module.exports = router;
