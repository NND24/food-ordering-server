const { getUserOrder, getOrderDetail, cancelOrder, reOrder, addStoreRating } = require("../controller");
const Order = require("./../shared/model/order");
const Store = require("./../shared/model/store");
const Cart = require("./../shared/model/cart");
const Rating = require("./../shared/model/rating");

jest.mock("./../shared/model/order");
jest.mock("./../shared/model/store");
jest.mock("./../shared/model/cart");
jest.mock("./../shared/model/rating");

function mockReqRes({ body = {}, user = {}, params = {} } = {}) {
  const req = { body, user, params };
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const next = jest.fn();
  const res = { status };
  return { req, res, next, json, status };
}

/* ================================
   Test cho getUserOrder
================================ */

test("TC_UO_1 - getUserOrder: should call next with error if userId is missing", async () => {
  const { req, res, next } = mockReqRes({ body: {}, user: null });

  await getUserOrder(req, res, next);

  // Kiểm tra next được gọi với lỗi có status code 400 và thông báo "User not found"
  expect(next).toHaveBeenCalled();
  const error = next.mock.calls[0][0];
  expect(error.status).toBe(400);
  expect(error.message).toBe("User not found");
});

test("TC_UO_2 - getUserOrder: should call next with error if no orders found", async () => {
  const req = { user: { _id: "user123" } };
  const res = {};
  const next = jest.fn();

  // ⚠️ Giả lập các chained method trả về mảng rỗng
  const mockSort = jest.fn().mockReturnValue([]);
  const mockPopulate4 = jest.fn().mockReturnValue({ sort: mockSort });
  const mockPopulate3 = jest.fn().mockReturnValue({ populate: mockPopulate4 });
  const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 });
  const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });

  Order.find.mockReturnValue({ populate: mockPopulate1 });

  await getUserOrder(req, res, next);

  expect(next).toHaveBeenCalled();
  const error = next.mock.calls[0][0];
  console.log("🧪 Error:", error);

  expect(error).toBeInstanceOf(Error);
  expect(error.status).toBe(404);
  expect(error.message).toBe("Order not found");
});

test("TC_UO_3 - getUserOrder: should return orders with store status APPROVED", async () => {
  const userId = "67ba0ddde145d9ad24039666";

  const ordersMock = [
    { store: { status: "APPROVED" }, _id: "684f92cf73f5954412369562" },
    { store: { status: "PENDING" }, _id: "684ad261e08d7d8c4b287682" },
  ];

  const { req, res, next, json, status } = mockReqRes({ user: { _id: userId } });

  // 🛠️ Sửa mock đúng kiểu chain (populate, sort)
  const mockSort = jest.fn().mockResolvedValue(ordersMock);
  const mockPopulate4 = jest.fn().mockReturnValue({ sort: mockSort });
  const mockPopulate3 = jest.fn().mockReturnValue({ populate: mockPopulate4 });
  const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 });
  const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });

  Order.find.mockReturnValue({ populate: mockPopulate1 });

  await getUserOrder(req, res, next);

  expect(status).toHaveBeenCalledWith(200);
  expect(json).toHaveBeenCalledWith({
    success: true,
    data: ordersMock.filter((order) => order.store.status === "APPROVED"),
  });
});

/* ================================
   Test cho getOrderDetail
================================ */

test("TC_OD_1 - getOrderDetail: should call next with error if orderId missing", async () => {
  const { req, res, next } = mockReqRes({ params: {} });

  await getOrderDetail(req, res, next);

  expect(next).toHaveBeenCalled();
  const error = next.mock.calls[0][0];
  expect(error.status).toBe(400);
  expect(error.message).toBe("orderId not found");
});

test("TC_OD_2 - getOrderDetail: should call next with error if order not found", async () => {
  const { req, res, next } = mockReqRes({ params: { orderId: "order123" } });

  // Giả lập chuỗi .populate().populate().populate()... trả về null cuối cùng
  const mockPopulate = jest.fn();
  const finalResult = null;

  mockPopulate.mockReturnValue({
    populate: mockPopulate,
  });
  // Gọi 4 lần populate => trả về null ở lần cuối cùng
  mockPopulate.mockReturnValueOnce({ populate: mockPopulate });
  mockPopulate.mockReturnValueOnce({ populate: mockPopulate });
  mockPopulate.mockReturnValueOnce({ populate: mockPopulate });
  mockPopulate.mockReturnValueOnce(finalResult); // cuối cùng trả về null

  Order.findById = jest.fn().mockReturnValue({
    populate: mockPopulate,
  });

  await getOrderDetail(req, res, next);

  expect(next).toHaveBeenCalled();
  const error = next.mock.calls[0][0];
  expect(error.status).toBe(404);
  expect(error.message).toBe("Order not found");
});

test("TC_OD_3 - getOrderDetail: should return order detail if found", async () => {
  const orderMock = { _id: "684f73a673f59544123694e7", data: "detail" };
  const { req, res, next, json, status } = mockReqRes({
    params: { orderId: "684f73a673f59544123694e7" },
  });

  // Mock chuỗi populate trả về orderMock ở cuối
  const mockPopulate = jest.fn();
  mockPopulate.mockReturnValue({ populate: mockPopulate }); // gọi 3 lần
  mockPopulate.mockReturnValueOnce({ populate: mockPopulate });
  mockPopulate.mockReturnValueOnce({ populate: mockPopulate });
  mockPopulate.mockReturnValueOnce({ populate: mockPopulate });
  mockPopulate.mockReturnValueOnce(orderMock); // kết thúc bằng orderMock

  Order.findById = jest.fn().mockReturnValue({
    populate: mockPopulate,
  });

  await getOrderDetail(req, res, next);

  expect(status).toHaveBeenCalledWith(200);
  expect(json).toHaveBeenCalledWith({
    success: true,
    data: orderMock,
  });
});

/* ================================
   Test cho cancelOrder
================================ */

test("TC_CO_1 - cancelOrder: should call next with error if order not found", async () => {
  const { req, res, next } = mockReqRes({ params: { orderId: "order123" }, user: { _id: "67ba0ddde145d9ad24039666" } });

  Order.findById.mockResolvedValue(null);

  await cancelOrder(req, res, next);

  expect(next).toHaveBeenCalled();
  const error = next.mock.calls[0][0];
  expect(error.message).toBe("Order not found");
});

test("TC_CO_2 - cancelOrder: should call next with error if order does not belong to user", async () => {
  const { req, res, next } = mockReqRes({
    params: { orderId: "684f73a673f59544123694e7" },
    user: { _id: "67baf94d2f34b1faaae0c23e" },
  });

  // Đơn có user khác với req.user
  Order.findById.mockResolvedValue({ _id: "684f73a673f59544123694e7", user: "userDifferent", status: "pending" });

  await cancelOrder(req, res, next);

  expect(next).toHaveBeenCalled();
  const error = next.mock.calls[0][0];
  expect(error.message).toBe("You are not authorized to cancel this order");
});

/* ================================
   Test cho reOrder
================================ */

test("TC_RO_1 - reOrder: should return 401 if userId is missing", async () => {
  const { req, res } = mockReqRes({ body: { storeId: "store123", items: [] }, user: null });

  await reOrder(req, res);

  expect(res.status).toHaveBeenCalledWith(401);
});

test("TC_RO_2 - reOrder: should return 400 if storeId is missing", async () => {
  const { req, res } = mockReqRes({
    body: { items: [{ dish: { stockStatus: "IN_STOCK" } }] },
    user: { _id: "user123" },
  });

  await reOrder(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("TC_RO_3 - reOrder: should return 400 if items are empty or not array", async () => {
  const { req, res } = mockReqRes({
    body: { storeId: "67c6e409f1c07122e88619d6", items: [] },
    user: { _id: "user123" },
  });

  await reOrder(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("TC_RO_4 - reOrder: should return 404 if store not found", async () => {
  const { req, res } = mockReqRes({
    body: { storeId: "store123", items: [{ dish: { stockStatus: "IN_STOCK" } }] },
    user: { _id: "user123" },
  });

  Store.findById.mockResolvedValue(null);

  await reOrder(req, res);

  expect(res.status).toHaveBeenCalledWith(404);
});

test("TC_RO_5 - reOrder: should return 403 if store is BLOCKED", async () => {
  const { req, res } = mockReqRes({
    body: { storeId: "store123", items: [{ dish: { stockStatus: "IN_STOCK" } }] },
    user: { _id: "user123" },
  });

  Store.findById.mockResolvedValue({ _id: "6817586286b61f2b3494c30a", status: "BLOCKED" });

  await reOrder(req, res);

  expect(res.status).toHaveBeenCalledWith(403);
});

test("TC_RO_6 - reOrder: should return 403 if any item has out-of-stock dish", async () => {
  const { req, res } = mockReqRes({
    body: {
      storeId: "store123",
      items: [{ dish: { stockStatus: "OUT_OF_STOCK" } }, { dish: { stockStatus: "IN_STOCK" } }],
    },
    user: { _id: "user123" },
  });

  // Giả lập store hợp lệ
  Store.findById.mockResolvedValue({ _id: "67c6e409f1c07122e88619d6", status: "APPROVED" });

  await reOrder(req, res);

  expect(res.status).toHaveBeenCalledWith(403);
});

test("TC_RO_7 - reOrder: should update cart if it exists", async () => {
  const userId = "67ba0ddde145d9ad24039666";
  const storeId = "67c6e409f1c07122e88619d6";
  const items = [{ dish: { stockStatus: "IN_STOCK" } }];
  const mockCart = { save: jest.fn() };

  const { req, res } = mockReqRes({ body: { storeId, items }, user: { _id: userId } });

  Store.findById.mockResolvedValue({ _id: storeId, status: "APPROVED" });
  // Không có món hết hàng
  // Giả lập cart đã tồn tại
  Cart.findOne.mockResolvedValue(mockCart);

  await reOrder(req, res);

  expect(mockCart.save).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(200);
});

test("TC_RO_8 - reOrder: should create new cart if not exists", async () => {
  const userId = "67ba0ddde145d9ad24039666";
  const storeId = "67c6e409f1c07122e88619d6";
  const items = [{ dish: { stockStatus: "IN_STOCK" } }];
  const newCart = { _id: "cart123" };

  const { req, res } = mockReqRes({ body: { storeId, items }, user: { _id: userId } });

  Store.findById.mockResolvedValue({ _id: storeId, status: "APPROVED" });
  Cart.findOne.mockResolvedValue(null);
  Cart.create.mockResolvedValue(newCart);

  await reOrder(req, res);

  expect(res.status).toHaveBeenCalledWith(201);
});

/* ================================
   Test cho addStoreRating
================================ */

test("TC_SR_1 - addStoreRating: should add rating successfully", async () => {
  const { req, res, next, json, status } = mockReqRes({
    params: { storeId: "67c6e409f1c07122e88619d6" },
    body: { dishes: [], ratingValue: 5, comment: "Great!", images: [] },
    user: { _id: "67ba0ddde145d9ad24039666" },
  });

  Rating.create.mockResolvedValue({ _id: "rating123" });

  await addStoreRating(req, res, next);

  expect(status).toHaveBeenCalledWith(201);
  expect(json).toHaveBeenCalledWith("Add rating successfully");
});

test("TC_SR_2 - addStoreRating: should call next with error if exception occurs", async () => {
  const { req, res, next } = mockReqRes({
    params: { storeId: "67c6e409f1c07122e88619d6" },
    body: { dishes: [], ratingValue: 5, comment: "Great!", images: [] },
    user: { _id: "67ba0ddde145d9ad24039666" },
  });

  Rating.create.mockRejectedValue(new Error("DB error"));

  await addStoreRating(req, res, next);

  expect(next).toHaveBeenCalled();
  const error = next.mock.calls[0][0];
  expect(error.message).toBe("DB error");
});
