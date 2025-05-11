const express = require("express");
const authMiddleware = require("./shared/middlewares/authMiddleware");
const { getUserFavorite, addFavorite, removeFavorite, removeAllFavorite } = require("./controller");
const router = express.Router();

router.get("/", authMiddleware, getUserFavorite);
router.post("/add/:storeId", authMiddleware, addFavorite);
router.delete("/remove/:storeId", authMiddleware, removeFavorite);
router.delete("/remove-all", authMiddleware, removeAllFavorite);

module.exports = router;
