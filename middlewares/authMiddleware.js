const User = require("../services/user/user.model");
const jwt = require("jsonwebtoken");
const createError = require("../utils/createError");

const authMiddleware = async (req, res, next) => {
  let token;
  if (req?.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded?.id);
        req.user = user;
        next();
      }
    } catch (error) {
      next(createError(401, "Not authorized token expired, Please login again!"));
    }
  } else {
    next("There is no token attached to header");
  }
};

module.exports = authMiddleware;
