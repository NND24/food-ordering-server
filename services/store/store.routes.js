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
  updateOrder,
  getAllStoreRating,
  updateDish,
  createDish,
  createCategory,
  deleteCategory,
  updateCategory,
  updateTopping,
  createStaff,
  updateStaff,
  registerStore,
  updateStore,
  checkRegisterStoreName,
  deleteDish,
  addToppingGroup,
  // createStore,
  // createToppingGroup,
  // createCategory,
  // createStaff,


  // updateToppingGroup,
  // updateCategory,
  // updateStaff
} = require("./store.controller");

const router = express.Router();

// Store routes
router.get("/", getAllStore);
router.get("/:store_id", getStoreInformation); // CHECK
router.post("/register", registerStore );
router.put("/:store_id", updateStore);
router.get("/check-name/:name", checkRegisterStoreName)

// Dish routes
router.get("/:store_id/dish", getAllDish); // CHECK // MOD
router.get("/dish/:dish_id", getDish); // CHECK
router.get("/dish/:dish_id/rating/avg", getAvgRating); // CHECK
router.get("/dish/:dish_id/rating/", getAllRating); // CHECK
router.get("/:store_id/rating/avg", getAvgStoreRating); // CHECK
router.get("/:storeId/rating", getAllStoreRating);
router.get("/dish/:dish_id/topping", getToppingFromDish); // CHECK
router.post("/dish/:dish_id/topping", addToppingToDish); // CHECK
router.put("/dish/:dish_id", updateDish)
router.post("/:store_id/dish/add", createDish);
router.delete("/dish/:dish_id", deleteDish);


// Order routes
router.get("/:store_id/order", getAllOrder); // CHECK
router.get("/order/:order_id", getOrder);  // CHECK
router.put("/order/:order_id", updateOrder);

// Topping routes
router.get("/:store_id/topping", getAllTopping); // CHECK
router.get("/topping-group/:group_id", getTopping); // CHECK
router.post("/:store_id/topping-group/add", addToppingGroup); // CHECK
router.post("/topping-group/:group_id/topping", addToppingToGroup); // CHECK
router.put("/topping-group/:group_id/topping/:topping_id", updateTopping)
router.delete("/topping-group/:group_id/topping/:topping_id", removeToppingFromGroup); // CHECK
router.delete("/topping-group/:group_id", deleteToppingGroup); // CHECK

router.post("/:store_id/topping/create", createToppingGroup); // CHECK
// router.put("/:store_id/topping/update", updateToppingGroup);

// Category routes
router.get("/:store_id/category", getAllCategory); // CHECK
router.get("/category/:category_id", getCategory); // CHECK
router.post("/:store_id/category/add", createCategory);
router.put("/category/:category_id", updateCategory);
router.delete("/category/:category_id", deleteCategory);

// Staff routes
router.get("/:store_id/staff", getAllStaff); // CHECK
router.get("/:store_id/staff/:staff_id", getStaff); // CHECK
router.post("/:store_id/staff/add", createStaff);
router.put("/:store_id/staff/update", updateStaff);



module.exports = router;
