const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
    getUserCart,
    increaseQuantity,
    decreaseQuantity,
    clearItem,
    clearCart,
    completeCart,
    updateCart
} = require("./cart.controller");
const router = express.Router();
router.get("/",authMiddleware, getUserCart);
router.post("/increase", authMiddleware, increaseQuantity);
router.post("/decrease", authMiddleware, decreaseQuantity);
router.post("/update", authMiddleware, updateCart);
router.post("/clear/:dish_id", authMiddleware, clearItem);
router.post("/clear", authMiddleware, clearCart);
router.post("/complete", authMiddleware, completeCart);

module.exports = router;