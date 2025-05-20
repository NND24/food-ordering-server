const express = require("express");
const authMiddleware = require("./shared/middlewares/authMiddleware");
const validateMongoDbId = require("./shared/middlewares/validateMongoDBId");
const {
  getAllFoodTypes,
  getFoodType,
  updateFoodType,
  deleteFoodType,
  createFoodType,
} = require("./controller");
const {
  authorize,
  verifyToken,
} = require("./shared/middlewares/authMiddlewareAdmin");
const router = express.Router();

router.get("/", getAllFoodTypes);
router.get("/:id", validateMongoDbId("id"), getFoodType);

router.put("/:id", verifyToken, authorize(["ADMIN"]), updateFoodType);
router.delete("/:id", verifyToken, authorize(["ADMIN"]), deleteFoodType);
router.post("/", verifyToken, authorize(["ADMIN"]), createFoodType);

module.exports = router;
