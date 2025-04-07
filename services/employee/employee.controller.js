const Employee = require("./employee.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");

const getAllEmployees = asyncHandler(async (req, res, next) => {
  try {
    const getEmployees = await Employee.find({}).select(
      "name email phonenumber gender avatar status role"
    );

    res.json(getEmployees);
  } catch (error) {
    next(error);
  }
});

const addEmployee = asyncHandler(async (req, res, next) => {
  const { name, email, phonenumber, gender, password, role, avatar } = req.body;
  const findEmployee = await Employee.findOne({ email });
  if (!findEmployee) {
    await Employee.create({
      name,
      email,
      phonenumber,
      gender,
      password: password || phonenumber,
      role,
      avatar: avatar || { url: "" },
    });
    res.status(201).json("Add employee successfully");
  } else {
    next(createError(409, "Employee has already existed"));
  }
});

const getEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const getEmployee = await Employee.findById(id).select(
      "name email phonenumber gender avatar role"
    );

    if (getEmployee) {
      res.json(getEmployee);
    } else {
      next(createError(404, "Employee not found"));
    }
  } catch (error) {
    next(error);
  }
});

const updateEmployee = asyncHandler(async (req, res, next) => {
  const employeeId = req.params.id; // Lấy id từ URL
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      req.body,
      { new: true }
    );
    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(updatedEmployee);
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

    res.json({
      msg: "Delete Employee successfully!",
      deletedEmployee: employee,
    });
  } catch (error) {
    next(error);
  }
});

const changeRoles = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { roles } = req.body;
  try {
    const employee = await Employee.findById(id);

    if (!employee) {
      return next(createError(404, "Employee not found"));
    }
    employee.role = roles;
    await employee.save();

    res.status(200).json({ message: "Update Roles Successfully", employee });
  } catch (error) {
    next(error);
  }
});

const blockEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findByIdAndUpdate(
      id,
      { status: "BLOCKED" },
      { new: true }
    );

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
    const employee = await Employee.findByIdAndUpdate(
      id,
      { status: "APPROVED" },
      { new: true }
    );

    if (!employee) {
      return next(createError(404, "Employee not found"));
    }

    res.json({ message: "Employee account has been approved", employee });
  } catch (error) {
    next(error);
  }
});

const verifyOldPassword = asyncHandler(async (req, res) => {
  const { oldPassword } = req.body;
  const employeeId = req.user.id;

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res
        .status(404)
        .json({ message: "Employee not existed! " + employeeId });
    }

    const isMatch = await employee.isPasswordMatched(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is not correct!" });
    }

    res.status(200).json({ message: "Correct password!" });
  } catch (error) {
    res.status(500).json({ message: "Error server!" });
  }
});

const resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const { id } = req.params;
  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json({ message: "Employee not existed! " + id });
    }

    employee.password = newPassword;
    await employee.save();
    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAllEmployees,
  getEmployee,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  blockEmployee,
  approveEmployee,
  changeRoles,
  verifyOldPassword,
  resetPassword,
};
