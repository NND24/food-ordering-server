const User = require("./shared/model/user");
const Shipper = require("./shared/model/shipper");
const Chat = require("./shared/model/chat");
const Message = require("./shared/model/message");
const Store  = require("./shared/model/store");

const createError = require("./shared/utils/createError");

const asyncHandler = require("express-async-handler");

const createChat = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { storeId } = req.body;

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
    let chatData = {};
    if (storeId) {
      chatData = {
        isGroupChat: false,
        users: [req.user._id, id],
        store: storeId,
      };
    } else {
      chatData = {
        isGroupChat: false,
        users: [req.user._id, id],
      };
    }

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

// const getAllChats = asyncHandler(async (req, res, next) => {
//   try {
//     await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
//       .populate("users", "name avatar")
//       .populate("latestMessage")
//       .sort({ updatedAt: -1 })
//       .then(async (results) => {
//         results = await User.populate(results, {
//           path: "latestMessage.sender",
//           select: "name avatar",
//         });

//         res.status(200).json(results);
//       });
//   } catch (error) {
//     next(error);
//   }
// });

const getAllChats = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRoles = req.user.role;

    let chatQuery = [{ users: userId }];

    if (userRoles.includes("staff") || userRoles.includes("manager")) {
      const stores = await Store.find({ staff: userId }).select("owner");

      const ownerIds = stores.map((store) => store.owner);

      if (ownerIds.length > 0) {
        chatQuery.push({ users: { $in: ownerIds } });
      }
    } else if (userRoles.includes("storeOwner")) {
      const store = await Store.findOne({ owner: userId }).select("_id");

      if (store) {
        chatQuery.push({ store: store._id });
      }
    }

    let chats = await Chat.find({
      $or: chatQuery,
    })
      .populate("store", "name avatar")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    chats = await Promise.all(
      chats.map(async (chat) => {
        const populatedUsers = await Promise.all(
          chat.users.map(async (userId) => {
            let user = await User.findById(userId).select("name avatar").lean();
            if (!user) {
              user = await Shipper.findById(userId).select("name avatar").lean();
            }
            return user;
          })
        );

        let populatedSender = null;
        if (chat.latestMessage?.sender) {
          populatedSender = await User.findById(chat.latestMessage.sender).select("name avatar").lean();
          if (!populatedSender) {
            populatedSender = await Shipper.findById(chat.latestMessage.sender).select("name avatar").lean();
          }
        }

        return {
          ...chat.toObject(),
          users: populatedUsers,
          latestMessage: chat.latestMessage
            ? {
                ...chat.latestMessage.toObject(),
                sender: populatedSender,
              }
            : null,
        };
      })
    );

    res.status(200).json(chats);
  } catch (error) {
    next(error);
  }
});

const createStoreChat = asyncHandler(async (req, res, next) => {
  const { id, storeId } = req.params;

  if (!id || !storeId) {
    return next(createError(400, "UserId or StoreId params not sent with request"));
  }

  try {
    const store = await Store.findById(storeId);
    if (!store || !store.owner) {
      return next(createError(404, "Store or store owner not found"));
    }

    const ownerId = store.owner;

    let isChat = await Chat.findOne({
      users: { $all: [ownerId, id] },
      store: storeId,
    })
      .populate("users", "name avatar")
      .populate("latestMessage")
      .populate("store", "name avatar");

    if (isChat) {
      isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name avatar",
      });
      return res.json(isChat);
    }

    const chatData = {
      isGroupChat: false,
      users: [ownerId, id],
      store: storeId,
    };

    const createdChat = await Chat.create(chatData);

    const fullChat = await Chat.findById(createdChat._id)
      .populate("users", "name avatar")
      .populate("latestMessage")
      .populate("store", "name avatar");

    const populatedChat = await User.populate(fullChat, {
      path: "latestMessage.sender",
      select: "name avatar",
    });

    return res.status(200).json(populatedChat);
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
  createStoreChat,
};
