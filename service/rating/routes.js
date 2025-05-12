const express = require("express");
const authMiddleware = require("./shared/middlewares/authMiddleware");
const validateMongoDbId = require("./shared/middlewares/validateMongoDBId");
const {
  getAllStoreRating,
  getDetailRating,
  addStoreRating,
  editStoreRating,
  deleteStoreRating,
} = require("./controller");

const router = express.Router();

router.get("/:storeId", validateMongoDbId("storeId"), getAllStoreRating);
router.get("/detail/:ratingId", validateMongoDbId("ratingId"), getDetailRating);

router.post("/:storeId", authMiddleware, validateMongoDbId("storeId"), addStoreRating);
router.put("/:ratingId", authMiddleware, validateMongoDbId("ratingId"), editStoreRating);
router.delete("/:ratingId", authMiddleware, validateMongoDbId("ratingId"), deleteStoreRating);

module.exports = router;
