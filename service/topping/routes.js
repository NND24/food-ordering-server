const express = require("express");
const {
  verifyToken,
  authorizeStoreStaff
} = require("./shared/middlewares/authMiddlewareAdmin");

const {
    getAllTopping,
    getTopping,
    addToppingGroup,
    addToppingToGroup,
    updateTopping,
    removeToppingFromGroup,
    deleteToppingGroup,
    createToppingGroup,
    getToppingFromDish,
    addToppingToDish
} = require("./controller")

const router = express.Router();

router.get("/store/:store_id", getAllTopping); // CHECK
router.get("/topping-group/:group_id", getTopping); // CHECK
router.post("/store/:store_id/topping-group/add", verifyToken, authorizeStoreStaff(["owner", "manager"]), addToppingGroup); // CHECK
router.post("/topping-group/:group_id/topping", verifyToken, authorizeStoreStaff(["owner","manager"]), addToppingToGroup); // CHECK
router.put("/topping-group/:group_id/topping/:topping_id", verifyToken, authorizeStoreStaff(["owner", "manager"]),  updateTopping)
router.delete("/topping-group/:group_id/topping/:topping_id", verifyToken, authorizeStoreStaff(["owner", "manager"]),  removeToppingFromGroup); // CHECK
router.delete("/topping-group/:group_id", verifyToken, authorizeStoreStaff(["owner",  "manager"]),  deleteToppingGroup); // CHECK

router.post("store/:store_id/topping/create",verifyToken, authorizeStoreStaff(["owner", "manager"]),  createToppingGroup); // CHECK

router.get("/dish/:dish_id", getToppingFromDish); // CHECK
router.post("/dish/:dish_id", verifyToken, authorizeStoreStaff(["owner", "manager"]), addToppingToDish); // CHECK

module.exports = router