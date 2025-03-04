const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
    getUserFavorite
} = require("./favorite.controller");
const router = express.Router();

router.get("/", authMiddleware, getUserFavorite);

module.exports = router;