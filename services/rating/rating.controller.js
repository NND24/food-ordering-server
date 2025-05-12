const { Rating } = require("../store/store.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");
const { getPaginatedData } = require("../../utils/paging");

const getAllStoreRating = asyncHandler(async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { limit, page, sort } = req.query;

    let filterOptions = { store: storeId };
    const result = await getPaginatedData(Rating, filterOptions, "user dishes", parseInt(limit), parseInt(page));

    if (sort === "desc") {
      result.data = result.data.sort((a, b) => b.ratingValue - a.ratingValue);
    } else if (sort === "asc") {
      result.data = result.data.sort((a, b) => a.ratingValue - b.ratingValue);
    }

    res.status(200).json(result);
  } catch (error) {
    next(createError(500, error.message));
  }
});

const getDetailRating = asyncHandler(async (req, res, next) => {
  try {
    const { ratingId } = req.params;

    const currentRating = await Rating.findById(ratingId).populate("store");

    if (!currentRating) {
      next(createError(404, "Rating not found"));
    }

    res.status(200).json(currentRating);
  } catch (error) {
    next(createError(500, error.message));
  }
});

const addStoreRating = asyncHandler(async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const userId = req.user?._id;
    const { dishes, ratingValue, comment, images } = req.body;

    await Rating.create({
      user: userId,
      store: storeId,
      dishes,
      ratingValue,
      comment,
      images,
    });

    res.status(201).json("Add rating successfully");
  } catch (error) {
    next(createError(500, error.message));
  }
});

const editStoreRating = asyncHandler(async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const { ratingValue, comment, images } = req.body;

    const currentRating = await Rating.findById(ratingId);

    if (!currentRating) {
      next(createError(404, "Rating not found"));
    }

    currentRating.ratingValue = ratingValue ?? currentRating.ratingValue;
    currentRating.comment = comment ?? currentRating.comment;
    currentRating.images = images ?? currentRating.images;
    currentRating.updatedAt = new Date();

    const updatedRating = await currentRating.save();

    res.status(200).json({
      success: true,
      message: "Rating updated successfully",
    });
  } catch (error) {
    next(createError(500, error.message));
  }
});

const deleteStoreRating = asyncHandler(async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const currentRating = await Rating.findById(ratingId);

    if (!currentRating) {
      next(createError(404, "Rating not found"));
    }

    await Rating.findByIdAndDelete(ratingId);

    res.status(200).json({
      success: true,
      message: "Delete rating successfully",
    });
  } catch (error) {
    next(createError(500, error.message));
  }
});

module.exports = {
  getAllStoreRating,
  getDetailRating,
  addStoreRating,
  editStoreRating,
  deleteStoreRating,
};
