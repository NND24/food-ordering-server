const User = require("../../services/user/user.model");
const asyncHandler = require("express-async-handler");
const createError = require("../../utils/createError");
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } = require("firebase/storage");

const uploadFile = asyncHandler(async (file, folderName) => {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const modifiedFileName = folderName + "/" + uniqueSuffix + "-" + file.originalname;

  const storage = getStorage();
  const storageRef = ref(storage, modifiedFileName);
  const metadata = { contentType: file.mimetype };

  // Upload file lên Firebase Storage
  await uploadBytes(storageRef, file.buffer, metadata);

  // Lấy URL tải xuống
  const downloadURL = await getDownloadURL(storageRef);

  return {
    filePath: modifiedFileName,
    url: downloadURL,
    createdAt: Date.now(),
  };
});

const uploadAvatarImage = asyncHandler(async (req, res, next) => {
  const userId = req?.user?._id;

  if (!req.file) {
    return next(createError(400, "No file uploaded"));
  }

  const uploadedImage = await uploadFile(req.file, "avatars");
  const updateUser = await User.findByIdAndUpdate(
    userId,
    {
      avatar: uploadedImage,
    },
    { new: true }
  ).select("name email phonenumber gender role avatar isGoogleLogin");

  if (!updateUser) {
    return next(createError(404, "User not found"));
  }

  res.status(200).json(updateUser);
});

const uploadImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(createError(400, "No files uploaded"));
  }

  const uploadedFileDetails = []; // Lưu trữ thông tin chi tiết các file đã upload

  // Upload từng file và lấy thông tin
  await Promise.all(
    req.files.map(async (file) => {
      const uploadedFile = await uploadFile(file, "images");
      uploadedFileDetails.push(uploadedFile);
    })
  );

  // Trả về thông tin các file đã upload
  res.status(200).json(uploadedFileDetails);
});

const deleteFileFromFirebase = asyncHandler(async (filePath) => {
  const storage = getStorage();
  const decodedFilePath = decodeURIComponent(filePath); // Decode file path

  const fileRef = ref(storage, decodedFilePath);

  try {
    // Check if the file exists before deleting
    await getMetadata(fileRef);

    // Delete the file
    await deleteObject(fileRef);
    return { message: "File deleted successfully" };
  } catch (error) {
    console.error("Error during file deletion:", error.message);

    // Handle specific error cases
    if (error.code === "storage/object-not-found") {
      return { message: "File does not exist or has already been deleted" };
    }

    // Rethrow other errors
    throw new Error(`Failed to delete file: ${error.message}`);
  }
});

const deleteFile = asyncHandler(async (req, res, next) => {
  const { filePath } = req.body; // Lấy đường dẫn file từ body request

  // Kiểm tra xem đường dẫn file có được cung cấp hay không
  if (!filePath) {
    return next(createError(400, "File path is required"));
  }

  // Thực hiện xóa file
  const result = await deleteFileFromFirebase(filePath);
  res.status(200).json(result);
});

module.exports = {
  uploadAvatarImage,
  uploadImages,
  deleteFile,
};
