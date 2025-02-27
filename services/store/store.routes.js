const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
  getAllDish,
  getStoreInformation,
  getAllTopping,
  getAllCategory,
  getAllStaff,
  getOrder,
  getAllOrder,

  getDish,
  getTopping,
  getCategory,
  getStaff,
  getRating,
  getAvgRating,
  // getAllRatting,
  // getAvgStoreRating,
  // createDish,
  // createStore,
  // createToppingGroup,
  // createCategory,
  // createStaff,
  // updateDish,
  // updateStore,
  // updateToppingGroup,
  // updateCategory,
  // updateStaff
} = require("./store.controller");

const router = express.Router();

// Store routes
router.get("/:store_id", getStoreInformation);
// router.post("/add", createStore);
// router.put("/update", updateStore);

// Dish routes
router.get("/:store_id/dish/page/:no", getAllDish);
router.get("/dish/:dish_id", getDish);
router.get("/dish/:dish_id/rating", getRating);
router.get("/dish/:dish_id/rating/avg", getAvgRating)
// router.get("/dish/:dish_id/rating/page/:no", getAllRatting);
// router.get("/:store_id/rating/avg", getAvgStoreRating)
// router.post("/:store_id/dish/add", createDish);
// router.put("/:store_id/dish/update", updateDish);

// Topping routes
router.get("/:store_id/topping/page/:no", getAllTopping);
router.get("/topping/:group_id", getTopping);
// router.post("/:store_id/topping/add", createToppingGroup);
// router.put("/:store_id/topping/update", updateToppingGroup);

// Category routes
router.get("/:store_id/category/page/:no", getAllCategory);
router.get("/category/:category_id", getCategory);
// router.post("/:store_id/category/add", createCategory);
// router.put("/:store_id/category/update", updateCategory);

// Staff routes
router.get("/:store_id/staff/page/:no", getAllStaff);
router.get("/staff/:staff_id", getStaff);
// router.post("/:store_id/staff/add", createStaff);
// router.put("/:store_id/staff/update", updateStaff);

// Order routes
router.get("/:store_id/order/page/:no", getAllOrder);
router.get("/order/:order_id", getOrder);

module.exports = router;
