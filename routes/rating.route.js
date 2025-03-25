const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getAllStoreRating,
  getDetailRating,
  addStoreRating,
  editStoreRating,
  deleteStoreRating,
} = require("../controllers/rating.controller");
const validateMongoDbId = require("../middlewares/validateMongoDBId");

const router = express.Router();

router.get("/:storeId", validateMongoDbId("storeId"), getAllStoreRating);
router.get("/detail/:ratingId", validateMongoDbId("ratingId"), getDetailRating);

router.post("/:storeId", authMiddleware, validateMongoDbId("storeId"), addStoreRating);
router.put("/:ratingId", authMiddleware, validateMongoDbId("ratingId"), editStoreRating);
router.delete("/:ratingId", authMiddleware, validateMongoDbId("ratingId"), deleteStoreRating);

module.exports = router;
