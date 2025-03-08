const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMongoDbId = require("../../middlewares/validateMongoDBId");
const { getAllEmployees, getEmployee , addEmployee ,updateEmployee, deleteEmployee, blockEmployee, changeRoles } = require("./employee.controller");
const {authorize, verifyToken} = require("../../middlewares/authMiddlewareAdmin")

const router = express.Router();

router.get("/", verifyToken, authorize(["ADMIN", "EMPLOYEE"]), getAllEmployees);
router.get("/:id", validateMongoDbId("id"), getEmployee);
router.post("/", verifyToken, authorize(["ADMIN", "EMPLOYEE"]), addEmployee);
router.put("/", authMiddleware, updateEmployee);
router.delete("/:id", verifyToken, authorize(["ADMIN", "EMPLOYEE"]), deleteEmployee);
router.put("/:id/roles", verifyToken, authorize(["ADMIN", "EMPLOYEE"]), changeRoles);
router.patch("/:id/block", verifyToken, authorize(["ADMIN", "EMPLOYEE"]), blockEmployee);

module.exports = router;
