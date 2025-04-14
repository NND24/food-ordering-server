const User = require("../user/user.model");
const Shipper = require("../shipper/shipper.model");
const Chat = require("./chat.model");
const Message = require("../message/message.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");

const createChat = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(createError(400, "UserId params not sent with request"));
  }

  try {
    // Tìm cuộc trò chuyện giữa 2 user
    let isChat = await Chat.findOne({
      users: { $all: [req.user._id, id] },
    }).populate("latestMessage");

    if (isChat) {
      const populatedUsers = await Promise.all(
        isChat.users.map(async (userId) => {
          let user = await User.findById(userId).select("name avatar").lean();
          if (!user) {
            user = await Shipper.findById(userId).select("name avatar").lean();
          }
          return user;
        })
      );
    
      return res.json({
        ...isChat.toObject(),
        users: populatedUsers,
      });
    }

    // Nếu không có chat, tạo mới
    const chatData = {
      isGroupChat: false,
      users: [req.user._id, id],
    };

    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findById(createdChat._id).populate("latestMessage");

const populatedUsers = await Promise.all(
  fullChat.users.map(async (userId) => {
    let user = await User.findById(userId).select("name avatar").lean();
    if (!user) {
      user = await Shipper.findById(userId).select("name avatar").lean();
    }
    return user;
  })
);

res.status(200).json({
  ...fullChat.toObject(),
  users: populatedUsers,
});
  } catch (error) {
    next(error);
  }
});

const getAllChats = asyncHandler(async (req, res, next) => {
  try {
    let results = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("latestMessage")
      .sort({ updatedAt: -1 })

      results = await Promise.all(
        results.map(async (chat) => {
          const populatedUsers = await Promise.all(
            chat.users.map(async (userId) => {
              let user = await User.findById(userId).select("name avatar").lean().lean();
              if (!user) {
                user = await Shipper.findById(userId).select("name avatar").lean().lean();
              }
              return user;
            })
          );
          return {
            ...chat.toObject(),
            users: populatedUsers
          };
        })
      );

      res.status(200).json(results);
  } catch (error) {
    next(error);
  }
});

const deleteChat = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    await Message.deleteMany({ chat: id });

    await Chat.findByIdAndDelete(id);

    res.json({
      success: true,
      data: "Delete successful!",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  createChat,
  getAllChats,
  deleteChat,
};
