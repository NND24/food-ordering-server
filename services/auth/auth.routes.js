const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
  register,
  registerShipper,
  login, loginAdmin, loginShipper,
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
} = require("./auth.controller");

const router = express.Router();

router.post("/register", register);
router.post("/register/store-owner", registerStoreOwner);
router.get("/check-register-store-owner/:email", checkRegisterStoreOwner);
router.post("/register/shipper", registerShipper);
router.post("/login", login);
router.post("/store", authMiddleware, storeOwnByUser)
router.post("/login/admin", loginAdmin);
router.post("/login/shipper", loginShipper);
router.post("/login/google", googleLoginWithToken);
router.post("/login/google/mobile", loginWithGoogleMobile);
router.post("/forgot-password", forgotPassword);
router.post("/check-otp", checkOTP);
router.post("/logout", logout);
router.get("/refresh", getRefreshToken);

router.put("/change-password", authMiddleware, changePassword);
router.put("/reset-password", resetPassword);

module.exports = router;
