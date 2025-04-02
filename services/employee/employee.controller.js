const Employee = require("./employee.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");


const getAllEmployees = asyncHandler(async (req, res, next) => {
  try {
    const getEmployees = await Employee.find({}).select("name email phonenumber gender avatar status role");

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
      password: password || phonenumber,
      role
    });
    res.status(201).json("Add employee successfully");
  } else {
    next(createError(409, "Employee has already existed"));
  }
});

const getEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const getEmployee = await Employee.findById(id).select("name email phonenumber gender avatar role");

    if (getShipper) {
      res.json(getShipper);
    } else {
      next(createError(404, "Employee not found"));
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
  const employeeId = req.params.id; // Lấy ID từ URL

  try {
    const employee = await Employee.findByIdAndDelete(employeeId);
    if (!employee) {
      return res.status(404).json({ msg: "Employee not found!" });
    }

    res.json({ msg: "Delete Employee successfully!", deletedEmployee: employee });
  } catch (error) {
    next(error);
  }
});

const changeRoles = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { roles } = req.body;
  try {
    const employee = await Employee.findById(id);

    if(!employee) {
      return next(createError(404, "Employee not found"));
    }
    employee.role = roles;
    await employee.save();

    res.status(200).json({ message: "Update Roles Successfully", employee });
  } catch (error) {
    next(error);
  }
})


const blockEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findByIdAndUpdate(id, { status: "BLOCKED" }, { new: true });

    if (!employee) {
      return next(createError(404, "Employee not found"));
    }

    res.json({ message: "Employee account has been blocked", employee });
  } catch (error) {
    next(error);
  }
});

const approveEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findByIdAndUpdate(id, { status: "APPROVED" }, { new: true });

    if (!employee) {
      return next(createError(404, "Employee not found"));
    }

    res.json({ message: "Employee account has been approved", employee });
  } catch (error) {
    next(error);
  }
});

module.exports = { getAllEmployees, getEmployee, addEmployee, updateEmployee, 
                  deleteEmployee, blockEmployee, approveEmployee, changeRoles };
