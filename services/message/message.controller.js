const Message = require("./message.model");
const User = require("../user/user.model");
const Shipper = require("../shipper/shipper.model");
const Chat = require("../chat/chat.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");

const sendMessage = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  var newMessage = {
    sender: req.user._id,
    content: req.body?.content,
    image: req.body?.image,
    chat: id,
  };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "name avatar");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name avatar",
    });

    await Chat.findByIdAndUpdate(id, {
      latestMessage: message,
    });

    res.json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    next(error);
  }
});

const getAllMessages = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    let messages = await Message.find({ chat: id });
    let chat = await Chat.findById(id).populate("latestMessage");

    const populatedUsers = await Promise.all(
      chat.users.map(async (userId) => {
        let user = await User.findById(userId).select("name avatar").lean();
        if (!user) {
          user = await Shipper.findById(userId).select("name avatar").lean();
        }
        return user;
      })
    );

    chat = {
      ...chat.toObject(),
      users: populatedUsers,
    }

    if (!messages) next(createError(404, "Message not found!"));

    res.json({ chat, messages });
  } catch (error) {
    next(error);
  }
});

const deleteMessage = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    await Message.findByIdAndDelete(id, { new: true });
    res.json({
      success: true,
      data: "Delete successful!",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = { sendMessage, getAllMessages, deleteMessage };
