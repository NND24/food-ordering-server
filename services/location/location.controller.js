const User = require("../user/user.model");
const Location = require("./location.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");

const addLocation = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;
  const { type } = req.body;

  try {
    if (!userId) {
      next(createError(400, "User ID is required"));
    }

    if (["home", "company"].includes(type)) {
      const existingLocation = await Location.findOne({ user: userId, type });
      if (existingLocation) {
        return next(createError(400, `You can only have one ${type} location.`));
      }
    }

    Location.create({
      ...req.body,
      user: userId,
    });

    res.status(201).json("Add location successfully");
  } catch (error) {
    next(createError(500, error.message));
  }
});

const getLocation = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const location = await Location.findById(id);

    if (!location) {
      next(createError(404, "Location not found"));
    }

    res.status(200).json(location);
  } catch (error) {
    next(error);
  }
});

const getUserLocations = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;

  try {
    if (!userId) {
      next(createError(400, "User ID is required"));
    }

    const locations = await Location.find({ user: userId });

    res.status(200).json(locations);
  } catch (error) {
    next(error);
  }
});

const updateLocation = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const existingLocation = await Location.findById(id);
    if (!existingLocation) {
      next(createError(404, "Location not found"));
    }

    await Location.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });

    res.status(200).json("Update location successfully");
  } catch (error) {
    next(error);
  }
});

const deleteLocation = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const existingLocation = await Location.findById(id);
    if (!existingLocation) {
      next(createError(404, "Location not found"));
    }

    await Location.findByIdAndDelete(id).populate("user", "name avatar");

    res.status(200).json("Delete location successfully");
  } catch (error) {
    next(error);
  }
});

module.exports = {
  addLocation,
  getLocation,
  updateLocation,
  deleteLocation,
  getUserLocations,
};
