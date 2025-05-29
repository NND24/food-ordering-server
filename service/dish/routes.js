const express = require("express");
const authMiddleware = require("./shared/middlewares/authMiddleware")
const {
    authorize,
    verifyToken,
    authorizeStoreStaff
  } = require("./shared/middlewares/authMiddlewareAdmin");

const {
    getAllDish,
    updateDish,
    createDish,
    deleteDish,
    getDish,
    onOffSaleStatus
} = require("./controller")

const router = express.Router();

router.get("/store/:store_id",verifyToken, authorizeStoreStaff(["owner", "staff", "manager"]), getAllDish); // CHECK // MOD
router.get("/:dish_id", getDish); 
router.put("/:dish_id", verifyToken, authorizeStoreStaff(["owner", "manager"]), updateDish)
router.post("/store/:store_id" , verifyToken, authorizeStoreStaff(["owner", "manager"]), createDish);
router.post("/:dish_id/saleStatus", verifyToken, authorizeStoreStaff(["owner", "manager", "staff"]), onOffSaleStatus)
router.delete("/:dish_id", verifyToken, authorizeStoreStaff(["owner", "manager"]), deleteDish);


module.exports = router;

