const Notification = require("./notification.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");
const getPaginatedData = require("../../utils/paging").getPaginatedData;
const { Store } = require("../store/store.model");
const cron = require("node-cron");

const getNotifications = asyncHandler(async (req, res, next) => {
  try {
    const notification = await Notification.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
});

const updateNotification = asyncHandler(async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      next(createError(404, "Notification not found"));
    } else {
      notification.status ? (notification.status = "read") : notification?.status;
    }

    await notification.save();

    const notifications = await Notification.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
});

const getStoreNotifications = asyncHandler(async (req, res, next) => {
  try {
    const store_id = req.params.store_id;
    const { page, limit } = req.query;

    const store = await Store.findById(store_id);
    if (!store) {
      return next(createError(404, "Store not found"));
    }

    const owner_id = store.owner;

    // Make sure your Notification model uses `userId` field to store the owner ID
    const result = await getPaginatedData(
      Notification,
      { userId: owner_id },
      [],
      limit,
      page
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

cron.schedule("0 0 0 * * *", async () => {
  const thirtyDayAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await Notification.deleteMany({ status: "read", createdAt: { $lt: thirtyDayAgo } });
});

module.exports = { getNotifications, updateNotification, getStoreNotifications };
