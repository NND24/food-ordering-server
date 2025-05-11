const express = require("express");
const authMiddleware = require("./shared/middlewares/authMiddleware");
const validateMongoDbId = require("./shared/middlewares/validateMongoDBId");
const { uploadAvatarImage, uploadImages, deleteFile, uploadAvatarShipperImage } = require("./controller");
const { uploadToFirebase } = require("./shared/connection/firebase_connection");

const router = express.Router();

router.post("/avatar", authMiddleware, validateMongoDbId("id"), uploadToFirebase.single("file"), uploadAvatarImage);
router.post("/images", authMiddleware, validateMongoDbId("id"), uploadToFirebase.array("file", 10), uploadImages);
router.post("/avatar/shipper", uploadToFirebase.array("file", 10), uploadImages);
router.post("/avatar/employee", uploadToFirebase.array("file", 10), uploadImages);
router.delete("/delete-file", authMiddleware, deleteFile);

module.exports = router;
