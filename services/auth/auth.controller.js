const User = require("../user/user.model");
const jwt = require("jsonwebtoken");
const createError = require("../../utils/createError");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const { OAuth2Client } = require("google-auth-library");

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "3d" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "5d" });
};

const register = asyncHandler(async (req, res, next) => {
  const { name, email, phonenumber, gender, password } = req.body;
  const findUser = await User.findOne({ email: email });
  if (!findUser) {
    await User.create({
      name,
      email,
      phonenumber,
      gender,
      password,
    });
    res.status(201).json("Tạo tài khoản thành công");
  } else {
    next(createError(409, "Tài khoản đã tồn tại"));
  }
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(createError(400, "Vui lòng điền đầy đủ thông tin"));
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
    return next(createError(401, "Email hoặc mật khẩu không hợp lệ!"));
  }
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLoginWithToken = asyncHandler(async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "No token provided" });

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Kiểm tra xem user đã tồn tại chưa
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      newUser = new User({
        name: payload.name,
        email: payload.email,
        password: "123456789",
        avatar: {
          filePath: "",
          url: payload.picture,
          createdAt: new Date(),
        },
        isGoogleLogin: true,
      });
      await newUser.save();

      res.status(200).json({
        _id: newUser?._id,
        token: generateAccessToken(newUser?._id),
      });
    } else {
      if (user.isGoogleLogin) {
        res.status(200).json({
          _id: user?._id,
          token: generateAccessToken(user?._id),
        });
      } else {
        next(createError(409, "Tài khoản đã tồn tại"));
      }
    }
  } catch (error) {
    console.log(error);
    return next(createError(500, "Google authentication failed!"));
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
  if (!cookie?.refreshToken) return next(createError(204, "No refresh token in cookies"));

  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (user) {
    await User.findOneAndUpdate({ refreshToken }, { $set: { refreshToken: null } });
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
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

module.exports = {
  register,
  login,
  googleLoginWithToken,
  getRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
};
