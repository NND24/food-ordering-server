const User = require("./user.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

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

const changeUserPassword = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return next(createError(404, "User not found"));

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return next(createError(400, "Mật khẩu cũ không đúng"));

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);

    // Cập nhật mật khẩu
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công" });
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

module.exports = { getAllUser, getUser, updateUser, changeUserPassword, deleteUser };
