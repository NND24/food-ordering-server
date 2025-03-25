const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
  getAllStore,
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
  createToppingGroup,
  addToppingToGroup,
  removeToppingFromGroup,
  deleteToppingGroup,
  updateOrder
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
router.get("/", getAllStore);
router.get("/:store_id", getStoreInformation); // CHECK
// router.post("/add", createStore);
// router.put("/update", updateStore);

// Dish routes
router.get("/:store_id/dish", getAllDish); // CHECK // MOD
router.get("/dish/:dish_id", getDish); // CHECK
router.get("/dish/:dish_id/rating/avg", getAvgRating) // CHECK
router.get("/dish/:dish_id/rating/", getAllRating); // CHECK
router.get("/:store_id/rating/avg", getAvgStoreRating) // CHECK
router.get("/dish/:dish_id/topping", getToppingFromDish); // CHECK
router.post("/dish/:dish_id/topping", addToppingToDish); // CHECK
// router.post("/:store_id/dish/add", createDish);
// router.put("/:store_id/dish/update", updateDish);

// Topping routes
router.get("/:store_id/topping", getAllTopping); // CHECK
router.get("/topping-group/:group_id", getTopping);  // CHECK
router.post("/topping-group/:group_id/topping", addToppingToGroup); // CHECK
router.delete("/topping-group/:group_id/topping/:topping_id", removeToppingFromGroup); // CHECK
router.delete("/topping-group/:group_id", deleteToppingGroup); // CHECK

router.post("/:store_id/topping/create", createToppingGroup); // CHECK
// router.put("/:store_id/topping/update", updateToppingGroup);

// Category routes
router.get("/:store_id/category", getAllCategory);  // CHECK
router.get("/category/:category_id", getCategory); // CHECK
// router.post("/:store_id/category/add", createCategory);
// router.put("/:store_id/category/update", updateCategory);

// Staff routes
router.get("/:store_id/staff", getAllStaff); // CHECK
router.get("/staff/:staff_id", getStaff); // CHECK
// router.post("/:store_id/staff/add", createStaff);
// router.put("/:store_id/staff/update", updateStaff);

// Order routes
router.get("/:store_id/order", getAllOrder); // CHECK
router.get("/order/:order_id", getOrder);  // CHECK
router.put("/order/:order_id", updateOrder);

module.exports = router;
