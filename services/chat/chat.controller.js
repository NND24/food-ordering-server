const User = require("../user/user.model");
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
    })
      .populate("users", "name avatar")
      .populate("latestMessage");

    if (isChat) {
      isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name avatar",
      });
      return res.json(isChat);
    }

    // Nếu không có chat, tạo mới
    const chatData = {
      isGroupChat: false,
      users: [req.user._id, id],
    };

    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findById(createdChat._id).populate("users", "name avatar");

    res.status(200).json(fullChat);
  } catch (error) {
    next(error);
  }
});

const getAllChats = asyncHandler(async (req, res, next) => {
  try {
    await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "name avatar")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name avatar",
        });

        res.status(200).json(results);
      });
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
