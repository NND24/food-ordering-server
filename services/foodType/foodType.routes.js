const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMongoDbId = require("../../middlewares/validateMongoDBId");
const { getAllFoodTypes, getFoodType, updateFoodType, deleteFoodType, createFoodType } = require("./foodType.controller");

const router = express.Router();

router.get("/", getAllFoodTypes);
router.get("/:id", validateMongoDbId("id"), getFoodType);

router.put("/", authMiddleware, updateFoodType);

router.delete("/", authMiddleware, deleteFoodType);
router.post("/", authMiddleware, createFoodType );

module.exports = router;
