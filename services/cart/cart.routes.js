const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
    getUserCart,
    increaseQuantity,
    decreaseQuantity,
    clearItem,
    clearCart,
    completeCart
} = require("./cart.controller");
const router = express.Router();
router.get("/",authMiddleware, getUserCart);
router.post("/incease", authMiddleware, increaseQuantity);
router.post("/decease", authMiddleware, decreaseQuantity);
router.post("/clear/:dish_id", authMiddleware, clearItem);
router.post("/clear", authMiddleware, clearCart);
router.post("/complete", authMiddleware, completeCart);

module.exports = router;