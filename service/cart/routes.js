const express = require("express");
const authMiddleware = require("./shared/middlewares/authMiddleware");
const {
  getUserCart,
  getUserCartInStore,
  getDetailCart,
  increaseQuantity,
  decreaseQuantity,
  clearItem,
  clearCartItem,
  clearCart,
  completeCart,
  updateCart,
  reOrder,
} = require("./controller");
const validateMongoDbId = require("./shared/middlewares/validateMongoDBId");
const router = express.Router();
router.get("/", authMiddleware, getUserCart);
router.get("/:storeId", authMiddleware, getUserCartInStore);
router.get("/detail/:cartId", validateMongoDbId("cartId"), authMiddleware, getDetailCart);

router.post("/increase", authMiddleware, increaseQuantity);
router.post("/decrease", authMiddleware, decreaseQuantity);
router.post("/update", authMiddleware, updateCart);
router.post("/clear/:dish_id", authMiddleware, clearItem);
router.post("/clear/item/:storeId", authMiddleware, validateMongoDbId("storeId"), clearCartItem);
router.post("/clear", authMiddleware, clearCart);
router.post("/complete", authMiddleware, completeCart);
router.post("/re-order", authMiddleware, reOrder);

module.exports = router;
