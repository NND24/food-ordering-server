const express = require("express");
const validateMongoDbId = require("./shared/middlewares/validateMongoDBId");
const {
  getAllEmployees,
  getEmployee,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  blockEmployee,
  approveEmployee,
  changeRoles,
  verifyOldPassword,
  resetPassword
} = require("./controller");
const {
  authorize,
  verifyToken,
} = require("./shared/middlewares/authMiddlewareAdmin");

const router = express.Router();

router.get("/", verifyToken, authorize(["ADMIN", "EMPLOYEE"]), getAllEmployees);
router.get("/:id", validateMongoDbId("id"), getEmployee);
router.post("/", verifyToken, authorize(["ADMIN", "EMPLOYEE"]), addEmployee);
router.put(
  "/:id",
  verifyToken,
  authorize(["ADMIN", "EMPLOYEE"]),
  updateEmployee
);
router.delete(
  "/:id",
  verifyToken,
  authorize(["ADMIN", "EMPLOYEE"]),
  deleteEmployee
);
router.put(
  "/:id/roles",
  verifyToken,
  authorize(["ADMIN", "EMPLOYEE"]),
  changeRoles
);
router.patch(
  "/:id/block",
  verifyToken,
  authorize(["ADMIN", "EMPLOYEE"]),
  blockEmployee
);
router.patch(
  "/:id/approve",
  verifyToken,
  authorize(["ADMIN", "EMPLOYEE"]),
  approveEmployee
);
router.post("/verify-password", verifyToken, verifyOldPassword);
router.put("/reset-password/:id", verifyToken, resetPassword);

module.exports = router;
