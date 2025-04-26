const User = require("../services/user/user.model");
const Shipper = require("../services/shipper/shipper.model"); // Import model Shipper
const jwt = require("jsonwebtoken");
const createError = require("../utils/createError");

const authMiddleware = async (req, res, next) => {
  let token;
  if (req?.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Tìm user trước
        let user = await User.findById(decoded?.id);

        // Nếu không tìm thấy user, tìm shipper
        if (!user) {
          user = await Shipper.findById(decoded?.id);
          req.isShipper = true; // Đánh dấu đây là shipper
        } else {
          req.isShipper = false; // Không phải shipper
        }

        req.user = user;

        if (!user) {
          return next(createError(401, "User or Shipper not found"));
        }

        next();
      }
    } catch (error) {
      next(
        createError(401, "Not authorized token expired, Please login again!")
      );
    }
  } else {
    next(createError(401, "There is no token attached to header"));
  }
};

module.exports = authMiddleware;
