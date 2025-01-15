const User = require("./user.model");
const jwt = require("jsonwebtoken");
const createError = require("../../utils/createError");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "3d" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "5d" });
};

const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  const findUser = await User.findOne({ email: email });
  if (!findUser) {
    await User.create({
      name,
      email,
      password,
    });
    res.status(201);
  } else {
    next(createError(409, "User Already Exists"));
  }
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(createError(400, "Please fill all the fields"));
  }

  const findUser = await User.findOne({ email: email });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser._id);
    await User.findByIdAndUpdate(
      findUser._id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      maxAge: 5 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      _id: findUser?._id,
      token: generateAccessToken(findUser?._id),
    });
  } else {
    return next(createError(401, "Invalid username or password!"));
  }
});

const getRefreshToken = asyncHandler(async (req, res, next) => {
  const cookie = req?.cookies;
  if (!cookie?.refreshToken) {
    return next(createError(404, "No refresh token in cookies"));
  }

  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    return next(createError(404, "No refresh token present in database or not matched"));
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) return next(createError("400", "There is something wrong with refresh token"));
    const accessToken = generateAccessToken(user?._id);
    res.status(200).json({ accessToken });
  });
});

const logout = asyncHandler(async (req, res, next) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) return next(createError(400, "No refresh token in cookies"));

  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (user) {
    await User.findOneAndUpdate({ refreshToken }, { $set: { refreshToken: null } });
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: true,
  });
  res.status(200).json({ message: "Logout successful" });
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;

  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    await user.save();
    res.status(200).json("Password updated successfully!");
  } else {
    res.json(user);
  }
});

const forgotPasswordToken = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(create("404", "User not found with this email"));

  const token = await user.createPasswordResetToken();
  await user.save();
  const resetURL = `
      <p>Please follow this link to reset your password. This link is valid till 10 minutes from now.</p>
      <button>
        <a href='http://localhost:3000/reset-password/${token}'>Click Here</>
      </button>
    `;
  const data = {
    to: email,
    text: "",
    subject: "Forgot Password Link",
    htm: resetURL,
  };
  // sendEmail(data);
  res.status(200).json("Send email successfully");
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(create("400", "Token expired, please try again later"));
  user.password = password;
  (user.passwordResetToken = undefined), (user.passwordResetExpires = undefined);
  await user.save();
  res.status(200).json("Reset password successfully");
});

module.exports = { register, login, getRefreshToken, logout, updatePassword, forgotPasswordToken, resetPassword };
