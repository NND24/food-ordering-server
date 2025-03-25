const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const { getUserFavorite, addFavorite, removeFavorite, removeAllFavorite } = require("./favorite.controller");
const router = express.Router();

router.get("/", authMiddleware, getUserFavorite);
router.post("/add", authMiddleware, addFavorite);
router.post("/remove", authMiddleware, removeFavorite);
router.post("/remove-all", authMiddleware, removeAllFavorite);

module.exports = router;
