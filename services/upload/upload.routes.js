const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const validateMongoDbId = require("../../middlewares/validateMongoDBId");
const { uploadAvatarImage, uploadImages, deleteFile, uploadAvatarShipperImage } = require("./upload.controller");
const { uploadToFirebase } = require("../../config/firebase");

const router = express.Router();

router.post("/avatar", authMiddleware, validateMongoDbId("id"), uploadToFirebase.single("file"), uploadAvatarImage);
router.post(
  "/avatar/shipper",
  authMiddleware,
  validateMongoDbId("id"),
  uploadToFirebase.single("file"),
  uploadAvatarShipperImage
);
router.post("/images", authMiddleware, validateMongoDbId("id"), uploadToFirebase.array("file", 10), uploadImages);

router.delete("/delete-file", authMiddleware, deleteFile);

module.exports = router;
