const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
  register,
  registerShipper,
  login,
  loginAdmin,
  loginShipper,
  logout,
  getRefreshToken,
  changePassword,
  resetPassword,
  forgotPassword,
  checkOTP,
  googleLoginWithToken,
  loginWithGoogleMobile,
  storeOwnByUser,
  registerStoreOwner,
  checkRegisterStoreOwner
  forgotPasswordShipper,
  checkOTPForShipper,
  resetPasswordShipper,
  loginMobile,
  getRefreshTokenMobile,
  forgotPasswordEmployee,
  checkOTPForEmployee,
  resetPasswordEmployee,
} = require("./auth.controller");

const router = express.Router();

router.post("/register", register);
router.post("/register/store-owner", registerStoreOwner);
router.get("/check-register-store-owner/:email", checkRegisterStoreOwner);
router.post("/register/shipper", registerShipper);
router.post("/login", login);
router.post("/store", authMiddleware, storeOwnByUser);
router.post("/login/admin", loginAdmin);
router.post("/login/shipper", loginShipper);
router.post("/login/google", googleLoginWithToken);
router.post("/login/mobile", loginMobile);
router.post("/login/google/mobile", loginWithGoogleMobile);
router.post("/forgot-password", forgotPassword);
router.post("/check-otp", checkOTP);
router.post("/forgot-password/shipper", forgotPasswordShipper);
router.post("/forgot-password/employee", forgotPasswordEmployee);
router.post("/check-otp/shipper", checkOTPForShipper);
router.get("/logout", logout);
router.post("/check-otp/employee", checkOTPForEmployee);
router.get("/refresh", getRefreshToken);
router.get("/refresh/mobile", getRefreshTokenMobile);
router.put("/change-password", authMiddleware, changePassword);
router.put("/reset-password", resetPassword);
router.put("/reset-password/shipper", resetPasswordShipper);
router.put("/reset-password/employee", resetPasswordEmployee);

module.exports = router;
