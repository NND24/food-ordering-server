const express = require("express");
const {
  verifyToken,
  authorizeStoreStaff,
} = require("./shared/middlewares/authMiddlewareAdmin");

const {
  getAllCategory,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllStoreCategory
} = require("./controller");

const router = express.Router();

router.get("/", getAllCategory); // CHECK
router.get("/store/:store_id/category", getAllStoreCategory);
router.get("/:category_id", getCategory); // CHECK
router.post(
  "/store/:store_id/add",
  verifyToken,
  authorizeStoreStaff(["owner", "manager"]),
  createCategory
);
router.put(
  "/:category_id",
  verifyToken,
  authorizeStoreStaff(["owner", "manager"]),
  updateCategory
);
router.delete(
  "/:category_id",
  verifyToken,
  authorizeStoreStaff(["owner", "manager"]),
  deleteCategory
);

module.exports = router;
