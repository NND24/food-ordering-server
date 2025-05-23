const createError = require("../utils/createError");
const jwt = require("jsonwebtoken");
const Employee = require("../services/employee/employee.model");
const User = require("../services/user/user.model")

// Middleware kiểm tra token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Lấy token từ header
  if (!token) return next(createError(401, "Bạn chưa đăng nhập"));

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(createError(403, "Token không hợp lệ"));
    console.log("Decoded JWT:", user);
    req.user = user; // Gán user vào request
    next();
  });
};

// Middleware kiểm tra quyền
const authorize = (roles) => {
  return async (req, res, next) => {
    try {
      console.log("User in request:", req.user); 
      const employee = await Employee.findById(req.user.id);

      if (!employee || !roles.some(role => employee.role.includes(role))) {
        return next(createError(403, `Bạn không có quyền thực hiện hành động này. Quyền hiện tại: ${employee?.role}`));
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

const authorizeStoreStaff = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id)
      if (!user || !user.role.some(role => roles.includes(role))) {
        return next(createError(403, `Bạn không có quyền thực hiện hành động này. Quyền hiện tại: ${user?.role}`));
      }
      next();
    }
    catch (error) {
      next(error)
    }
  }
}




module.exports = { verifyToken, authorize, authorizeStoreStaff };
