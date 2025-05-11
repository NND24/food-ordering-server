const express = require("express");
const authMiddleware = require("./shared/middlewares/authMiddleware");
const {
  authorize,
  verifyToken,
  authorizeStoreStaff,
} = require("./shared/middlewares/authMiddlewareAdmin");

const {
  getStoreStats,
  getPendingStores,
  getOngoingStores,
  getAllStore,
  approveStore,
  blockedStore,
  getStoreInformation,
  registerStore,
  updateStore,
  checkRegisterStoreName,
  getAllStaff,
  getStaff,
  createStaff,
  updateStaff,
} = require("./controller");

const router = express.Router();

router.get("/stats", verifyToken, getStoreStats);
// Store routes
router.get(
  "/pending",
  verifyToken,
  authorize(["ADMIN", "STORE"]),
  getPendingStores
);
router.get(
  "/ongoing",
  verifyToken,
  authorize(["ADMIN", "STORE"]),
  getOngoingStores
);
router.get("/", getAllStore);
router.patch(
  "/:store_id/approve",
  verifyToken,
  authorize(["ADMIN", "STORE"]),
  approveStore
);
router.patch(
  "/:store_id/block",
  verifyToken,
  authorize(["ADMIN", "STORE"]),
  blockedStore
);
router.get(
  "/:store_id",
  verifyToken,
  authorizeStoreStaff(["owner"]),
  getStoreInformation
); // CHECK
router.post("/register", registerStore);
router.put(
  "/:store_id",
  verifyToken,
  authorizeStoreStaff(["owner"]),
  updateStore
);
router.get("/check-name/:name", checkRegisterStoreName);

// manage staff in store
router.get(
  "/:store_id/staff",
  verifyToken,
  authorizeStoreStaff(["owner", "manager"]),
  getAllStaff
);
router.get(
  "/:store_id/staff/:staff_id",
  verifyToken,
  authorizeStoreStaff(["owner", "manager"]),
  getStaff
);
router.post(
  "/:store_id/staff/add",
  verifyToken,
  authorizeStoreStaff(["owner"]),
  createStaff
);
router.put(
  "/:store_id/staff/update",
  verifyToken,
  authorizeStoreStaff(["owner"]),
  updateStaff
);
// Missing delete staff

module.exports = router;
