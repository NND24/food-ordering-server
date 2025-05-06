const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const {
  authorize,
  verifyToken,
  authorizeStoreStaff
} = require("../../middlewares/authMiddlewareAdmin");
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
  // updateStaff,
  getStoreStats,
  getPendingStores,
  approveStore,
  blockedStore,
  getOngoingStores
} = require("./store.controller");

const router = express.Router();

// Stats
router.get("/stats", verifyToken, getStoreStats);
// Store routes
router.get(
  "/pending",
  verifyToken,
  authorize(["ADMIN", "STORE"]),
  getPendingStores
);
router.get(
  "/ongoing",
  verifyToken,
  authorize(["ADMIN", "STORE"]),
  getOngoingStores
);
router.get("/", getAllStore);
router.patch("/:store_id/approve", verifyToken, authorize(["ADMIN", "STORE"]), approveStore);
router.patch("/:store_id/block", verifyToken, authorize(["ADMIN", "STORE"]), blockedStore);
router.get("/:store_id",verifyToken, authorizeStoreStaff(["owner"]), getStoreInformation); // CHECK
router.post("/register", registerStore );
router.put("/:store_id",verifyToken, authorizeStoreStaff(["owner"]), updateStore);
router.get("/check-name/:name", checkRegisterStoreName)

// Dish routes
router.get("/:store_id/dish",verifyToken, authorizeStoreStaff(["owner", "staff", "manager"]), getAllDish); // CHECK // MOD
router.get("/dish/:dish_id", getDish); // CHECK
router.get("/dish/:dish_id/rating/avg", getAvgRating); // CHECK
router.get("/dish/:dish_id/rating/", getAllRating); // CHECK
router.get("/:store_id/rating/avg", getAvgStoreRating); // CHECK
router.get("/dish/:dish_id/topping", getToppingFromDish); // CHECK
router.post("/dish/:dish_id/topping", verifyToken, authorizeStoreStaff(["owner", "manager"]), addToppingToDish); // CHECK
router.put("/dish/:dish_id", verifyToken, authorizeStoreStaff(["owner", "manager"]), updateDish)
router.post("/:store_id/dish/add", createDish, verifyToken, authorizeStoreStaff(["owner", "manager"]), );
router.delete("/dish/:dish_id", deleteDish, verifyToken, authorizeStoreStaff(["owner", "manager"]), );


// Order routes
router.get("/:store_id/order", verifyToken, authorizeStoreStaff(["owner", "staff", "manager"]), getAllOrder); // CHECK
router.get("/order/:order_id", verifyToken, authorizeStoreStaff(["owner", "staff", "manager"]), getOrder);  // CHECK
router.put("/order/:order_id", verifyToken, authorizeStoreStaff(["owner", "staff", "manager"]), updateOrder);

// Topping routes
router.get("/:store_id/topping", getAllTopping); // CHECK
router.get("/topping-group/:group_id", getTopping); // CHECK
router.post("/:store_id/topping-group/add", verifyToken, authorizeStoreStaff(["owner", "manager"]), addToppingGroup); // CHECK
router.post("/topping-group/:group_id/topping", verifyToken, authorizeStoreStaff(["owner","manager"]), addToppingToGroup); // CHECK
router.put("/topping-group/:group_id/topping/:topping_id", verifyToken, authorizeStoreStaff(["owner", "manager"]),  updateTopping)
router.delete("/topping-group/:group_id/topping/:topping_id", verifyToken, authorizeStoreStaff(["owner", "manager"]),  removeToppingFromGroup); // CHECK
router.delete("/topping-group/:group_id", verifyToken, authorizeStoreStaff(["owner",  "manager"]),  deleteToppingGroup); // CHECK

router.post("/:store_id/topping/create",verifyToken, authorizeStoreStaff(["owner", "manager"]),  createToppingGroup); // CHECK
// router.put("/:store_id/topping/update", updateToppingGroup);

// Category routes
router.get("/:store_id/category", getAllCategory); // CHECK
router.get("/category/:category_id", getCategory); // CHECK
router.post("/:store_id/category/add", verifyToken, authorizeStoreStaff(["owner", "manager"]), createCategory);
router.put("/category/:category_id", verifyToken, authorizeStoreStaff(["owner", "manager"]), updateCategory);
router.delete("/category/:category_id", verifyToken, authorizeStoreStaff(["owner", "manager"]), deleteCategory);

// Staff routes
router.get("/:store_id/staff", verifyToken, authorizeStoreStaff(["owner", "manager"]), getAllStaff); // CHECK
router.get("/:store_id/staff/:staff_id", verifyToken, authorizeStoreStaff(["owner", "manager"]), getStaff); // CHECK
router.post("/:store_id/staff/add", verifyToken, authorizeStoreStaff(["owner"]), createStaff);
router.put("/:store_id/staff/update", verifyToken, authorizeStoreStaff(["owner"]), updateStaff);



module.exports = router;
