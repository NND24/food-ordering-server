const FoodType = require("./foodType.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");

const getAllFoodTypes = asyncHandler(async (req, res, next) => {
  try {
    const getFoodTypes = await FoodType.find();

    res.json(getFoodTypes);
  } catch (error) {
    next(error);
  }
});

const createFoodType = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return next(createError(400, "Tên loại thức ăn không hợp lệ"));
  }
  const findFoodType = await FoodType.isNameExists(name);
  if (!findFoodType) {
    await FoodType.create({
      name,
    });
    res.status(201).json("Tạo loại thức ăn thành công");
  } else {
    next(createError(409, "Loại thức ăn đã tồn tại"));
  }
});

const getFoodType = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const getFoodType = await FoodType.findById(id).select("name image");

    if (getFoodType) {
      res.json(getFoodType);
    } else {
      next(createError(404, "Không tìm thấy loại đồ ăn"));
    }
  } catch (error) {
    next(error);
  }
});

const updateFoodType = asyncHandler(async (req, res, next) => {
  const foodTypeId = req?.foodType?._id;
  try {
    const updateFoodType = await FoodType.findByIdAndUpdate(foodTypeId, req.body, { new: true });
    res.json(updateUser);
  } catch (error) {
    next(error);
  }
});

const deleteFoodType = asyncHandler(async (req, res, next) => {
  const foodTypeId = req?.foodType?._id;
  try {
    await FoodType.findByIdAndDelete(foodTypeId);
    res.json({ msg: "Delete FoodType successfully!" });
  } catch (error) {
    next(error);
  }
});

module.exports = { getAllFoodTypes, getFoodType, updateFoodType, deleteFoodType, createFoodType };
