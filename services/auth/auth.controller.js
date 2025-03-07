const User = require("../user/user.model");
const Shipper = require("../shipper/shipper.model")
const jwt = require("jsonwebtoken");
const createError = require("../../utils/createError");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const { OAuth2Client } = require("google-auth-library");
const sendEmail = require("../../utils/sendEmail");

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
};

const register = asyncHandler(async (req, res, next) => {
  const { name, email, phonenumber, gender, password } = req.body;
  const findUser = await User.findOne({ email });
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

const registerShipper = asyncHandler(async (req, res, next) => {
  const { name, email, phonenumber, gender, password } = req.body;
  const findShipper = await Shipper.findOne({ email });
  if (!findShipper) {
    await Shipper.create({
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
    const refreshToken = generateRefreshToken(findUser._id);
    await User.findByIdAndUpdate(
      findUser._id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
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
    console.log(token);
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

      const refreshToken = generateRefreshToken(newUser._id);
      await User.findByIdAndUpdate(
        newUser._id,
        {
          refreshToken: refreshToken,
        },
        { new: true }
      );
      res.cookie("refreshToken", refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        _id: newUser?._id,
        token: generateAccessToken(newUser?._id),
      });
    } else {
      if (user.isGoogleLogin) {
        const refreshToken = generateRefreshToken(user._id);
        await User.findByIdAndUpdate(
          user._id,
          {
            refreshToken: refreshToken,
          },
          { new: true }
        );
        res.cookie("refreshToken", refreshToken, {
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

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

const loginWithGoogleMobile = asyncHandler(async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Kiểm tra xem user đã tồn tại chưa
    let user = await User.findOne({ email });
    if (!user) {
      newUser = new User({
        name: name,
        email: email,
        password: "123456789",
        isGoogleLogin: true,
      });
      await newUser.save();

      const refreshToken = generateRefreshToken(newUser._id);
      await User.findByIdAndUpdate(
        newUser._id,
        {
          refreshToken: refreshToken,
        },
        { new: true }
      );
      res.cookie("refreshToken", refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        _id: newUser?._id,
        token: generateAccessToken(newUser?._id),
      });
    } else {
      if (user.isGoogleLogin) {
        const refreshToken = generateRefreshToken(user._id);
        await User.findByIdAndUpdate(
          user._id,
          {
            refreshToken: refreshToken,
          },
          { new: true }
        );
        res.cookie("refreshToken", refreshToken, {
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
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
  res.status(200).json("Logout successful");
});

const changePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(_id);
  if (!user) return next(createError(404, "User not found"));

  // Kiểm tra mật khẩu cũ
  const isMatch = await user.isPasswordMatched(oldPassword);
  if (!isMatch) return next(createError(400, "Mật khẩu cũ không đúng"));

  user.password = newPassword;
  await user.save();

  res.status(200).json("Đổi mật khẩu thành công!");
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(createError(404, "User not found"));

  user.password = newPassword;
  await user.save();

  res.status(200).json("Đổi mật khẩu thành công!");
});

const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email, isGoogleLogin: false });
  if (!user)
    return next(createError("404", "Tài khoản không tồn tại hoặc tài khoản được đăng nhập bằng phương thức khác"));

  const otp = await user.createOtp();
  await user.save();
  const resetURL = `
      <p>Mã OTP của bạn là: ${otp}</p>
      <p>Vui lòng nhập mã này để lấy lại mật khẩu. OTP sẽ hết hạn trong 2 phút</p>
    `;
  const data = {
    to: email,
    text: "",
    subject: "Forgot Password OTP",
    htm: resetURL,
  };
  sendEmail(data);
  res.status(200).json("Send email successfully");
});

const checkOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const user = await User.findOne({
    email,
    otp: hashedOTP,
    otpExpires: { $gt: Date.now() },
  });

  if (!user) return next(createError("400", "OPT đã hết hạn hoặc không đúng mã, vui lòng thử lại"));

  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.status(200).json("OTP hợp lệ");
});

module.exports = {
  register,
  registerShipper,
  login,
  googleLoginWithToken,
  loginWithGoogleMobile,
  getRefreshToken,
  logout,
  changePassword,
  resetPassword,
  forgotPassword,
  checkOTP,
};
