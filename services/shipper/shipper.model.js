const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { type } = require("os");

var shipperSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phonenumber: {
      type: String,
      trim: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      default: function () {
        return this.phonenumber;
      },
    },
    gender: {
      type: String,
      enum: ["female", "male", "other"],
      default: "other",
    },
    role: {
      type: [String],
      enum: ["user", "manager", "admin", "shipper", "staff", "owner"],
      default: ["shipper"],
    },
    avatar: {
      filePath: { type: String, required: false },
      url: {
        type: String,
        required: true,
        default:
          "https://res.cloudinary.com/datnguyen240/image/upload/v1722168751/avatars/avatar_pnncdk.png",
      },
      createdAt: { type: Date, default: Date.now },
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "BLOCKED"],
      default: "PENDING",
    },
    vehicle: {
      name: { type: String, required: true },
      number: { type: String, required: true },
    },
    refreshToken: {
      type: String,
    },
    isGoogleLogin: { type: Boolean, default: false },
    otp: String,
    otpExpires: Date,
  },
  {
    timestamps: true,
  }
);

shipperSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});

shipperSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

shipperSchema.methods.createOtp = async function () {
  // Tạo OTP gồm 6 số
  const newOTP = Math.floor(100000 + Math.random() * 900000).toString();

  // Mã hóa OTP trước khi lưu vào database
  this.otp = crypto.createHash("sha256").update(newOTP).digest("hex");

  // Thời gian hết hạn trong 2 phút
  this.otpExpires = Date.now() + 2 * 60 * 1000;

  await this.save();

  // Trả về OTP (chưa mã hóa) để gửi cho người dùng
  return newOTP;
};

module.exports = mongoose.model("Shipper", shipperSchema);
