const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
  getAllDish,
  getStoreInformation,
  getAllTopping,
  getAllCategory,
  getAllStaff,
  getAllOrder,
  getOrder,
  getDish,
  getTopping,
  getCategory,
  getStaff,
  getRating,
  getAllComment,
  createDish,
  createStore,
  createToppingGroup,
  createCategory,
  createStaff,
  updateDish,
  updateStore,
  updateToppingGroup,
  updateCategory,
  updateStaff
} = require("./store.controller");

const router = express.Router();

// Store routes
router.get("/store/:store_id", getStoreInformation);
router.post("/store/add", createStore);
router.put("/store/update", updateStore);

// Dish routes
router.get("/store/:store_id/dish/page/:no", getAllDish);
router.get("/store/:store_id/dish/:dish_id", getDish);
router.get("/store/:store_id/dish/:dish_id/rating", getRating);
router.get("/store/:store_id/dish/:dish_id/comment/page/:no", getAllComment);
router.post("/store/:store_id/dish/add", createDish);
router.put("/store/:store_id/dish/update", updateDish);

// Topping routes
router.get("/store/:store_id/topping/page/:no", getAllTopping);
router.get("/store/:store_id/topping/:group_id", getTopping);
router.post("/store/:store_id/topping/add", createToppingGroup);
router.put("/store/:store_id/topping/update", updateToppingGroup);

// Category routes
router.get("/store/:store_id/category/page/:no", getAllCategory);
router.get("/store/:store_id/category/:category_id", getCategory);
router.post("/store/:store_id/category/add", createCategory);
router.put("/store/:store_id/category/update", updateCategory);

// Staff routes
router.get("/store/:store_id/staff/page/:no", getAllStaff);
router.get("/store/:store_id/staff/:staff_id", getStaff);
router.post("/store/:store_id/staff/add", createStaff);
router.put("/store/:store_id/staff/update", updateStaff);

// Order routes
router.get("/store/:store_id/order/page/:no", getAllOrder);
router.get("/store/:store_id/order/:order_id", getOrder);

module.exports = router;
