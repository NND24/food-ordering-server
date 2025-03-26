const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const { getUserFavorite, addFavorite, removeFavorite, removeAllFavorite } = require("./favorite.controller");
const router = express.Router();

router.get("/", authMiddleware, getUserFavorite);
router.post("/add", authMiddleware, addFavorite);
router.delete("/remove/:storeId", authMiddleware, removeFavorite);
router.delete("/remove-all", authMiddleware, removeAllFavorite);

module.exports = router;
