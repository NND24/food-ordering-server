const Shipper = require("./shipper.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");

const getAllShippers = asyncHandler(async (req, res, next) => {
  try {
    const query = {};
    const getShippers = await Shipper.find(query).select(
      "name email phonenumber gender avatar status"
    );

    res.json(getShippers);
  } catch (error) {
    next(error);
  }
});

const getShipper = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const getShipper = await Shipper.findById(id).select(
      "name email phonenumber gender avatar isGoogleLogin"
    );

    if (getShipper) {
      res.json(getShipper);
    } else {
      next(createError(404, "Không tìm thấy shipper"));
    }
  } catch (error) {
    next(error);
  }
});

const updateShipper = asyncHandler(async (req, res, next) => {
  const shipperId = req?.user?._id;
  try {
    const updateShipper = await Shipper.findByIdAndUpdate(shipperId, req.body, {
      new: true,
    });
    res.json(updateShipper);
  } catch (error) {
    next(error);
  }
});

const deleteShipper = asyncHandler(async (req, res, next) => {
  const shipperId = req?.shipper?._id;
  try {
    await Shipper.findByIdAndDelete(shipperId);
    res.json({ msg: "Delete Shipper successfully!" });
  } catch (error) {
    next(error);
  }
});

const approveShipper = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const shipper = await Shipper.findByIdAndUpdate(
      id,
      { status: "APPROVED" },
      { new: true }
    );

    if (!shipper) {
      return next(createError(404, "Không tìm thấy shipper"));
    }

    res.json({ message: "Shipper đã được duyệt", shipper });
  } catch (error) {
    next(error);
  }
});

const blockShipper = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const shipper = await Shipper.findByIdAndUpdate(
      id,
      { status: "BLOCKED" },
      { new: true }
    );

    if (!shipper) {
      return next(createError(404, "Không tìm thấy shipper"));
    }

    res.json({ message: "Shipper đã bị khóa", shipper });
  } catch (error) {
    next(error);
  }
});

const verifyOldPassword = asyncHandler(async (req, res) => {
  const { oldPassword } = req.body;
  const shipperId = req.user._id;

  try {
    const shipper = await Shipper.findById(shipperId);
    if (!shipper) {
      return res.status(404).json({ message: "Shipper không tồn tại!" });
    }

    const isMatch = await shipper.isPasswordMatched(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng!" });
    }

    res.status(200).json({ message: "Mật khẩu đúng!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});

const resetPassword = asyncHandler(async (req, res, next) => {
  const { newPassword } = req.body;
  const shipperId = req.user._id;

  const shipper = await Shipper.findOne({ _id: shipperId });
  if (!shipper) return next(createError(404, "Không tìm thấy shipper"));

  shipper.password = newPassword;
  await shipper.save();

  res.status(200).json("Đổi mật khẩu thành công!");
});

const getPendingShippers = asyncHandler(async (req, res, next) => {
  try {
    const pendingShippers = await Shipper.find({ status: "PENDING" }).select(
      "name email phonenumber gender avatar"
    );

    res.json(pendingShippers);
  } catch (error) {
    next(error);
  }
});

const getCurrentShippers = asyncHandler(async (req, res, next) => {
  try {
    const currentShipper = await Shipper.find({
      status: { $in: ["APPROVED", "BLOCKED"] },
    }).select("name email phonenumber gender avatar status");

    res.json(currentShipper);
  } catch (error) {
    next(error);
  }
});

const getShipperStats = asyncHandler(async (req, res, next) => {
  try {
    const totalShippers = await Shipper.countDocuments();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const shippersThisMonth = await Shipper.countDocuments({
      createdAt: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    });

    res.status(200).json({
      code: 200,
      message: "Lấy thống kê shipper thành công",
      data: {
        totalShippers,
        shippersThisMonth,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getAllShippers,
  getShipper,
  updateShipper,
  deleteShipper,
  approveShipper,
  blockShipper,
  verifyOldPassword,
  resetPassword,
  getPendingShippers,
  getCurrentShippers,
  getShipperStats,
};
