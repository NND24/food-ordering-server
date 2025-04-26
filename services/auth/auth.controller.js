const User = require("../user/user.model");
const { Store } = require("../store/store.model")
const Shipper = require("../shipper/shipper.model");
const Employee = require("../employee/employee.model");
const jwt = require("jsonwebtoken");
const createError = require("../../utils/createError");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const { OAuth2Client } = require("google-auth-library");
const sendEmail = require("../../utils/sendEmail");

const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
};

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const generateAccessAdminToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
};

const storeOwnByUser = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const findStore = await Store.findOne({ owner: _id });
  res.status(200).json({ data: findStore });
});

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

const registerStoreOwner = asyncHandler(async (req, res, next) => {
  const { name, email, phonenumber, gender, password } = req.body;
  const findUser = await User.findOne({ email });
  if (!findUser) {
    // await User.create({
    //   name,
    //   email,
    //   phonenumber,
    //   gender,
    //   password,
    // });
    res.status(201).json("Tạo tài khoản thành công");
  } else {
     res.status(200).json({message : "Tài khoản đã tồn tại", data : findUser});
    next(createError(409, "Tài khoản đã tồn tại"));
  }
});

const checkRegisterStoreOwner = asyncHandler(async (req, res, next) => {
  const { email } = req.params;
  const findUser = await User.findOne({ email });

  if (findUser) {
    if (findUser.role.includes("owner")) {
      return res.status(200).json({ message: "Tài khoản đã được đăng ký làm chủ cửa hàng", data: findUser, role: "owner"});
    } else if (findUser.role.includes("staff")) {
      return res.status(200).json({ message: "Tài khoản đã được đăng ký làm nhân viên cửa hàng", data: findUser, role: "staff" });
    } else if (findUser.role.includes("shipper")) {
      return res.status(200).json({ message: "Tài khoản đã được đăng ký làm shipper", data: findUser, role: "shipper" });
    } else {
      return res.status(200).json({ message: "Tài khoản đã tồn tại", data: findUser });
    }
  } else {
    return res.status(200).json({ message: "Tài khoản chưa tồn tại", data: null });
  }
});

const registerShipper = asyncHandler(async (req, res, next) => {
  const { name, email, phonenumber, gender, password, avatar, vehicle } = req.body;

  // Kiểm tra email đã tồn tại chưa
  const findShipper = await Shipper.findOne({ email });
  if (findShipper) {
    return next(createError(409, "Tài khoản đã tồn tại"));
  }

  // Tạo tài khoản shipper mới, thêm avatar vào database
  const newShipper = await Shipper.create({
    name,
    email,
    phonenumber,
    gender,
    password,
    vehicle,
    ...(avatar && { avatar }), // Nếu không có ảnh thì để trống
  });

  res.status(201).json({
    message: "Tạo tài khoản thành công",
    shipperId: newShipper._id,
  });
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const { getRole, getStore } = req.query; // Get query params for role and store info

  if (!email || !password) {
    next(createError(400, "Vui lòng điền đầy đủ thông tin"));
  }

  const findUser = await User.findOne({ email: email });

  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = generateRefreshToken(findUser._id);
    await User.findByIdAndUpdate(
      findUser._id,
      { refreshToken: refreshToken },
      { new: true }
    );
    // Check if the user is associated with a store
    const store = await Store.findOne({
      $or: [{ owner: findUser._id }, { staff: findUser._id }],
    }).select("_id name owner");

    res.cookie("refreshToken", refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.status(200).json({
      _id: findUser._id,
      token: generateAccessToken(findUser._id),
      ...(getRole === "true" && { role: findUser.role }), // Include role if getRole is true
      ...(getStore === "true" && store && { storeId: store._id, ownerId: store.owner}), // Include storeId & name if requested
    });
  } else {
    return next(createError(401, "Email hoặc mật khẩu không hợp lệ!"));
  }
});


const loginAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(createError(400, "Vui lòng điền đầy đủ thông tin"));
  }

  const findEmployee = await Employee.findOne({ email: email });
  if (findEmployee && (await findEmployee.isPasswordMatched(password))) {
    const refreshToken = generateRefreshToken(findEmployee._id);
    await Employee.findByIdAndUpdate(
      findEmployee._id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      _id: findEmployee?._id,
      token: generateAccessAdminToken(findEmployee?._id, findEmployee.role),
    });
  } else {
    return next(createError(401, "Email hoặc mật khẩu không hợp lệ!"));
  }
});

const loginShipper = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(createError(400, "Vui lòng điền đầy đủ thông tin"));
  }

  const findShipper = await Shipper.findOne({ email: email });

  if (findShipper.status !== "APPROVED") {
    return next(createError(403, "Tài khoản chưa được phê duyệt!"));
  }
  if (findShipper && (await findShipper.isPasswordMatched(password))) {
    const refreshToken = generateRefreshToken(findShipper._id);
    await Shipper.findByIdAndUpdate(
      findShipper._id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      _id: findShipper?._id,
      token: generateAccessToken(findShipper?._id),
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

const loginMobile = asyncHandler(async (req, res, next) => {
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
    res.status(200).json({
      _id: findUser?._id,
      token: generateAccessToken(findUser?._id),
      refreshToken,
    });
  } else {
    return next(createError(401, "Email hoặc mật khẩu không hợp lệ!"));
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

      res.status(200).json({
        _id: newUser?._id,
        token: generateAccessToken(newUser?._id),
        refreshToken,
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
        res.status(200).json({
          _id: user?._id,
          token: generateAccessToken(user?._id),
          refreshToken,
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

const getRefreshTokenMobile = asyncHandler(async (req, res, next) => {
  const refreshToken = req.query?.refreshToken;
  if (!refreshToken) {
    return next(createError(404, "No refresh token provided"));
  }

  const user = await User.findOne({ refreshToken });
  if (!user) {
    return next(createError(404, "No refresh token present in database or not matched"));
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      return next(createError(400, "There is something wrong with refresh token"));
    }
    const accessToken = generateAccessToken(user?._id);
    res.status(200).json({ token: accessToken });
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

const changePassword = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { oldPassword, newPassword } = req.body;

  // Validate required fields
  if (!oldPassword || !newPassword) {
    return next(createError(400, "Mật khẩu cũ và mật khẩu mới là bắt buộc"));
  }

  // Find the user
  const user = await User.findById(_id);
  if (!user) return next(createError(404, "User not found"));

  // Kiểm tra mật khẩu cũ
  const isMatch = await user.isPasswordMatched(oldPassword);
  if (!isMatch) return next(createError(400, "Mật khẩu cũ không đúng"));

  user.password = newPassword;
  await user.save();

  res.status(200).json("Đổi mật khẩu thành công!");
});

const resetPassword = asyncHandler(async (req, res, next) => {
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
    html: resetURL,
  };
  await sendEmail(data);
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

const forgotPasswordShipper = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const shipper = await Shipper.findOne({ email, isGoogleLogin: false });
  if (!shipper)
    return next(createError("404", "Tài khoản không tồn tại hoặc tài khoản được đăng nhập bằng phương thức khác"));

  const otp = await shipper.createOtp();
  await shipper.save();

  const resetURL = `
      <p>Mã OTP của bạn là: ${otp}</p>
      <p>Vui lòng nhập mã này để lấy lại mật khẩu. OTP sẽ hết hạn trong 2 phút</p>
    `;
  const data = {
    to: email,
    text: "",
    subject: "Forgot Password OTP",
    html: resetURL,
  };
  await sendEmail(data);
  res.status(200).json("Send email successfully");
});

const checkOTPForShipper = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  const shipper = await Shipper.findOne({
    email,
    otp: hashedOTP,
    otpExpires: { $gt: Date.now() },
  });

  if (!shipper) return next(createError("400", "OPT đã hết hạn hoặc không đúng mã, vui lòng thử lại"));

  shipper.otp = undefined;
  shipper.otpExpires = undefined;
  await shipper.save();

  res.status(200).json("OTP hợp lệ");
});

const resetPasswordShipper = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const shipper = await Shipper.findOne({ email });
  if (!shipper) return next(createError(404, "Shipper not found"));

  shipper.password = password;
  await shipper.save();

  res.status(200).json("Đổi mật khẩu thành công!");
});

const forgotPasswordEmployee = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const employee = await Employee.findOne({ email });
  if (!employee) return next(createError("404", "Account not existed!"));

  const otp = await employee.createOtp();
  await employee.save();

  const resetURL = `
      <p>Your otp is: ${otp}</p>
      <p>Please you this to reset your password. It will be expired in 2 minutes</p>
    `;
  const data = {
    to: email,
    text: "",
    subject: "Forgot Password OTP",
    html: resetURL,
  };
  await sendEmail(data);
  res.status(200).json("Send email successfully");
});

const checkOTPForEmployee = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  const employee = await Employee.findOne({
    email,
    otp: hashedOTP,
    otpExpires: { $gt: Date.now() },
  });

  if (!employee)
    return next(createError("400", "Your otp is not correct or expired!"));

  employee.otp = undefined;
  employee.otpExpires = undefined;
  await employee.save();

  res.status(200).json("OTP valid");
});

const resetPasswordEmployee = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const employee = await Employee.findOne({ email });
  if (!employee) return next(createError(404, "Employee not found"));

  employee.password = password;
  await employee.save();

  res.status(200).json("Reset password successfully!");
});

module.exports = {
  register,
  registerShipper,
  login,
  loginAdmin,
  loginShipper,
  googleLoginWithToken,
  loginMobile,
  loginWithGoogleMobile,
  getRefreshToken,
  getRefreshTokenMobile,
  logout,
  changePassword,
  resetPassword,
  forgotPassword,
  checkOTP,
  registerStoreOwner,
  checkRegisterStoreOwner,
  storeOwnByUser,
  forgotPasswordShipper,
  checkOTPForShipper,
  resetPasswordShipper,
  forgotPasswordEmployee,
  checkOTPForEmployee,
  resetPasswordEmployee,
};
