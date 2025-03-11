const Shipper = require("./shipper.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");


const getAllShippers = asyncHandler(async (req, res, next) => {
  try {
    const getShippers = await Shipper.find(query).select("name email phonenumber gender avatar");

    res.json(getShippers);
  } catch (error) {
    next(error);
  }
});

const getShipper = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const getShipper = await Shipper.findById(id).select("name email phonenumber gender avatar isGoogleLogin");

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
    const updateShipper = await Shipper.findByIdAndUpdate(shipperId, req.body, { new: true });
    res.json(updateUser);
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
    const shipper = await Shipper.findByIdAndUpdate(id, { status: "APPROVED" }, { new: true });

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
    const shipper = await Shipper.findByIdAndUpdate(id, { status: "BLOCKED" }, { new: true });

    if (!shipper) {
      return next(createError(404, "Không tìm thấy shipper"));
    }

    res.json({ message: "Shipper đã bị khóa", shipper });
  } catch (error) {
    next(error);
  }
});

module.exports = { getAllShippers, getShipper, updateShipper, deleteShipper, approveShipper, blockShipper };
