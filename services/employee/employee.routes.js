const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMongoDbId = require("../../middlewares/validateMongoDBId");
const { getAllEmployees, getEmployee , addEmployee ,updateEmployee, deleteEmployee, blockEmployee } = require("./employee.controller");

const router = express.Router();

router.get("/", getAllEmployees);
router.get("/:id", validateMongoDbId("id"), getEmployee);
router.post("/", authMiddleware, addEmployee);
router.put("/", authMiddleware, updateEmployee);

router.delete("/", authMiddleware, deleteEmployee);

router.patch("/:id/block", authMiddleware, blockEmployee);

module.exports = router;
