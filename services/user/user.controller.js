const User = require("./user.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");

const getAllUser = asyncHandler(async (req, res, next) => {
  try {
    const getUsers = await User.find(query).select("name email phonenumber gender role avatar");

    res.json(getUsers);
  } catch (error) {
    next(error);
  }
});

const getUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const getUser = await User.findById(id).select("name email phonenumber gender role avatar isGoogleLogin");

    if (getUser) {
      res.json(getUser);
    } else {
      next(createError(404, "Không tìm thấy người dùng"));
    }
  } catch (error) {
    next(error);
  }
});

const updateUser = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;
  try {
    const updateUser = await User.findByIdAndUpdate(userId, req.body, { new: true });
    res.json(updateUser);
  } catch (error) {
    next(error);
  }
});

const deleteUser = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;
  try {
    await User.findByIdAndDelete(userId);
    res.json({ msg: "Delete User successfully!" });
  } catch (error) {
    next(error);
  }
});
module.exports = { getAllUser, getUser, updateUser, deleteUser };
