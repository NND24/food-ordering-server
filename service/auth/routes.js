const express = require("express");
const authMiddleware = require("./shared/middlewares/authMiddleware");
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
  checkRegisterStoreOwner,
  forgotPasswordShipper,
  checkOTPForShipper,
  resetPasswordShipper,
  loginMobile,
  getRefreshTokenMobile,
  forgotPasswordEmployee,
  checkOTPForEmployee,
  resetPasswordEmployee,
} = require("./controller");

const router = express.Router();
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Registers a new user in the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Internal server error
 */
router.post("/register", register);
/**
 * @swagger
 * /auth/register/store-owner:
 *   post:
 *     summary: Register a store owner
 *     description: Registers a store owner
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               storeName:
 *                 type: string
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Store owner registered successfully
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Internal server error
 */
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