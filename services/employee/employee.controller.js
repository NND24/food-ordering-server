const Employee = require("./employee.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");


const getAllEmployees = asyncHandler(async (req, res, next) => {
  try {
    const getEmployees = await Employee.find(query).select("name email phonenumber gender avatar role");

    res.json(getEmployees);
  } catch (error) {
    next(error);
  }
});

const addEmployee = asyncHandler(async (req, res, next) => {
  const { name, email, phonenumber, gender, password, role } = req.body;
  const findEmployee = await Employee.findOne({ email });
  if (!findEmployee) {
    await Employee.create({
      name,
      email,
      phonenumber,
      gender,
      password,
      role
    });
    res.status(201).json("Thêm nhân viên thành công");
  } else {
    next(createError(409, "Nhân viên đã tồn tại"));
  }
});

const getEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const getEmployee = await Employee.findById(id).select("name email phonenumber gender avatar role");

    if (getShipper) {
      res.json(getShipper);
    } else {
      next(createError(404, "Không tìm thấy shipper"));
    }
  } catch (error) {
    next(error);
  }
});

const updateEmployee = asyncHandler(async (req, res, next) => {
  const employeeId = req?.employee?._id;
  try {
    const updateEmployee = await Employee.findByIdAndUpdate(employeeId, req.body, { new: true });
    res.json(updateEmployee);
  } catch (error) {
    next(error);
  }
});

const deleteEmployee = asyncHandler(async (req, res, next) => {
  const employeeId = req?.employee?._id;
  try {
    await Employee.findByIdAndDelete(employeeId);
    res.json({ msg: "Delete Employee successfully!" });
  } catch (error) {
    next(error);
  }
});

const blockEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findByIdAndUpdate(id, { status: "BLOCKED" }, { new: true });

    if (!employee) {
      return next(createError(404, "Không tìm thấy nhân viên"));
    }

    res.json({ message: "Nhân viên đã bị khóa", employee });
  } catch (error) {
    next(error);
  }
});

module.exports = { getAllEmployees, getEmployee, addEmployee, updateEmployee, deleteEmployee, blockEmployee };
