const Message = require("./message.model");
const User = require("../user/user.model");
const Chat = require("../chat/chat.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");

const sendMessage = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Chat ID

  const chat = await Chat.findById(id).populate("store users");

  if (!chat) return next(createError(404, "Chat not found"));

  // Check if user is allowed to send in this chat
  const isStaff = ["owner", "manager", "staff"].includes(req.user.role);
  const isClientChat = chat.users.some(
    (u) => u._id.toString() === req.user._id.toString()
  );

  const isStoreChat = chat.store && isStaff;

  if (!isClientChat && !isStoreChat) {
    return next(createError(403, "Not authorized to send messages in this chat"));
  }

  const newMessage = {
    sender: req.user._id, // always a User
    content: req.body?.content,
    image: req.body?.image,
    chat: id,
  };

  try {
    let message = await Message.create(newMessage);
    message = await message.populate("sender", "name avatar");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name avatar",
    });

    await Chat.findByIdAndUpdate(id, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    next(error);
  }
});


const getAllMessages = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    const messages = await Message.find({ chat: id }).populate("sender", "name avatar").populate("chat");
    const chat = await Chat.findById(id).populate("users", "name avatar").populate("latestMessage");

    if (!messages) next(createError(404, "Message not found!"));

    res.json({ chat, messages });
  } catch (error) {
    next(error);
  }
});

const deleteMessage = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedMessage = await Message.findByIdAndDelete(id, { new: true });
    res.json(deletedMessage);
  } catch (error) {
    next(error);
  }
});

module.exports = { sendMessage, getAllMessages, deleteMessage };
