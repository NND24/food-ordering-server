const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
  register,
  registerShipper,
  login, loginAdmin,
  logout,
  getRefreshToken,
  changePassword,
  resetPassword,
  forgotPassword,
  checkOTP,
  googleLoginWithToken,
  loginWithGoogleMobile,
} = require("./auth.controller");

const router = express.Router();


// Store Auth
// router.post("/register/store", registerStore);
// router.post("/login/gogle/store", storeLoginGoogleWithToken);
// router.post("login/google/mobile/store", storeLoginGoogleWithMobile)

// router.post("/logout/store")0

router.post("/register", register);
router.post("/register/shipper", registerShipper);
router.post("/login", login);
router.post("/login/admin", loginAdmin);
router.post("/login/google", googleLoginWithToken);
router.post("/login/google/mobile", loginWithGoogleMobile);
router.post("/forgot-password", forgotPassword);
router.post("/check-otp", checkOTP);
router.post("/logout", logout);

router.get("/refresh", getRefreshToken);

router.put("/change-password", authMiddleware, changePassword);
router.put("/reset-password", resetPassword);

module.exports = router;
