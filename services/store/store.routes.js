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
  getAvgRating,
  getAllRating,
  getAvgStoreRating,
  getToppingFromDish,
  addToppingToDish,
  createTopping,
  addToppingToGroup,
  removeToppingFromGroup,
  deleteToppingGroup
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
router.get("/:store_id", getStoreInformation); // CHECK
// router.post("/add", createStore);
// router.put("/update", updateStore);

// Dish routes
router.get("/:store_id/dish/page/:no", getAllDish); // CHECK
router.get("/dish/:dish_id", getDish); // CHECK
router.get("/dish/:dish_id/rating/avg", getAvgRating) // CHECK
router.get("/dish/:dish_id/rating/page/:no", getAllRating); // CHECK
router.get("/:store_id/rating/avg", getAvgStoreRating) // CHECK
router.get("/dish/:dish_id/topping", getToppingFromDish)
// router.post("/dish/:dish_id/topping", addToppingToDish)
// router.post("/:store_id/dish/add", createDish);
// router.put("/:store_id/dish/update", updateDish);

// Topping routes
router.get("/:store_id/topping/page/:no", getAllTopping); // CHECK
router.get("/topping/:group_id", getTopping); // CHECK
// router.post("/topping/create", createTopping);
// router.post("/topping/:group_id/add", addToppingToGroup);
// router.post("/topping/:group_id/remove", removeToppingFromGroup);
// router.delete("/topping/:group_id", deleteToppingGroup)

// router.post("/:store_id/topping/add", createToppingGroup);
// router.put("/:store_id/topping/update", updateToppingGroup);

// Category routes
router.get("/:store_id/category/page/:no", getAllCategory);  // CHECK
router.get("/category/:category_id", getCategory); // CHECK
// router.post("/:store_id/category/add", createCategory);
// router.put("/:store_id/category/update", updateCategory);

// Staff routes
router.get("/:store_id/staff/page/:no", getAllStaff); // CHECK
router.get("/staff/:staff_id", getStaff); // CHECK
// router.post("/:store_id/staff/add", createStaff);
// router.put("/:store_id/staff/update", updateStaff);

// Order routes
router.get("/:store_id/order/page/:no", getAllOrder); // CHECK
router.get("/order/:order_id", getOrder);  // CHECK

module.exports = router;
