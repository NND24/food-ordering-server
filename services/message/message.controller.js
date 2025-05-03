const Message = require("./message.model");
const User = require("../user/user.model");
const Shipper = require("../shipper/shipper.model");
const Chat = require("../chat/chat.model");
const { Store } = require("../store/store.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");

const sendMessage = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Chat ID from request parameters

  // Fetch chat by ID and populate related store and users
  const chat = await Chat.findById(id).populate("store users");

  // If chat not found, return 404 error
  if (!chat) return next(createError(404, "Chat not found"));

  // Find the requesting user from the database
  const requestUser = await User.findById(req.user._id);

  // Check if the user's role includes staff-type roles
  const isStaff = requestUser.role.some((role) => ["owner", "manager", "staff"].includes(role));

  // Check if the current user is one of the chat participants (client side)
  const isClientChat = chat.users.some((u) => u._id.toString() === req.user._id.toString());

  // Get the store the user belongs to (as a staff member)
  const userStoreBelong = await Store.findOne({
    $or: [
      { staff: requestUser._id },
      { owner: requestUser._id }
    ]
  });

  // If the chat has a store and user is staff, verify store match
  if (chat.store && isStaff) {
    if (userStoreBelong._id.toString() === chat.store._id.toString()) {
      isStoreChat = true; // User is part of the store in this chat
    } else {
      return next(createError(403, "You do not belong to this store."));
    }
  }

  // If the user is neither a valid client nor a valid store member, deny access
  if (!isClientChat && !isStoreChat) {
    return next(createError(403, "Not authorized to send messages in this chat"));
  }

  // Prepare new message object with appropriate sender based on role
  const newMessage = {
    sender: isStoreChat ? chat.store.owner : req.user._id,
    content: req.body?.content,
    image: req.body?.image,
    chat: id,
  };

  try {
    // Create the new message
    let message = await Message.create(newMessage);

    // Populate sender and chat info for response
    message = await message.populate("sender", "name avatar");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name avatar",
    });

    // Update the chat's latest message
    await Chat.findByIdAndUpdate(id, {
      latestMessage: message,
    });
    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    // Forward any errors to the error handler
    next(error);
  }
});

const getAllMessages = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    // Lấy tin nhắn và chat
    let messages = await Message.find({ chat: id }).lean(); // Dùng lean để dễ chỉnh
    let chat = await Chat.findById(id).populate("store", "name avatar").populate("latestMessage").lean();

    if (!chat) return next(createError(404, "Chat not found"));

    // Populate users trong chat (có thể là User hoặc Shipper)
    const populatedUsers = await Promise.all(
      chat.users.map(async (userId) => {
        let user = await User.findById(userId).select("name avatar").lean();
        if (!user) {
          user = await Shipper.findById(userId).select("name avatar").lean();
        }
        return user;
      })
    );
    chat.users = populatedUsers;

    // Populate sender trong messages
    const populatedMessages = await Promise.all(
      messages.map(async (msg) => {
        let sender = await User.findById(msg.sender).select("name avatar").lean();
        if (!sender) {
          sender = await Shipper.findById(msg.sender).select("name avatar").lean();
        }
        return {
          ...msg,
          sender,
        };
      })
    );

    res.json({ chat, messages: populatedMessages });
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
