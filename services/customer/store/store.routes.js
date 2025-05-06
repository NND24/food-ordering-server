const express = require("express");
const {
  getStoreInformation,
  getAllDish,
  getAllOrder,
  getOrder,
  getAllStore,
  getDish,
  getToppingFromDish,
} = require("../../store/store.controller");

const router = express.Router();

router.get("/", getAllStore);
router.get("/:store_id", getStoreInformation);

router.get("/:store_id/dish", getAllDish);
router.get("/dish/:dish_id", getDish);

router.get("/:store_id/order", getAllOrder);
router.get("/order/:order_id", getOrder);

router.get("/dish/:dish_id/topping", getToppingFromDish);

module.exports = router;
