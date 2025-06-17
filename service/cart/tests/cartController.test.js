const { completeCart, updateCart } = require('../controller');
const Cart = require('./../shared/model/cart');
const Order = require('./../shared/model/order');
const Notification = require('./../shared/model/notification');
const Store = require('./../shared/model/store');
const Dish = require('./../shared/model/dish');
const ToppingGroup = require('./../shared/model/toppingGroup');
const socket = require('../socketClient');

jest.mock('./../shared/model/cart');
jest.mock('./../shared/model/order');
jest.mock('./../shared/model/notification');
jest.mock('./../shared/model/store');
jest.mock('./../shared/model/dish');
jest.mock('./../shared/model/toppingGroup');
jest.mock('../socketClient', () => ({ emit: jest.fn() }));

function mockReqRes(body = {}, user = {}) {
  const req = { body, user };
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const res = { status };
  return { req, res, json, status };
}

// TC_B1: Missing userId

test('TC_B1 - should return 401 if userId is missing (completeCart)', async () => {
  const { req, res } = mockReqRes({ storeId: '123' }, null);
  await completeCart(req, res);
  expect(res.status).toHaveBeenCalledWith(401);
});

// TC_B2: Missing required fields in body

test('TC_B2 - should return 400 if required fields missing (completeCart)', async () => {
  const { req, res } = mockReqRes({ storeId: '123' }, { _id: '67d128a02cb1ccb4a0abbdb0' });
  await completeCart(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});

// TC_B3: Cart is empty

test('TC_B3 - should return 400 if cart is empty (completeCart)', async () => {
  const { req, res } = mockReqRes({
    storeId: '67c6e409f1c07122e88619d6',
    paymentMethod: 'cash',
    deliveryAddress: 'some address',
    customerName: 'Tester',
    customerPhonenumber: '0123456789',
    location: [106.6, 10.8]
  }, { _id: '67d128a02cb1ccb4a0abbdb0' });

  Cart.findOne.mockResolvedValue(null);
  await completeCart(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});

// TC_B4: Should create new cart if not exists

test('TC_B4 - should create new cart if not exists (updateCart)', async () => {
  const { req, res } = mockReqRes({
    storeId: '67c6e409f1c07122e88619d6',
    dishId: '68157dd418a6b80afd2e90c0',
    quantity: 1,
    toppings: [
      '67dc1f22fa72c3f295e43434',
      '67e4bdc17d122ca7f70e9030'
    ]
  }, { _id: '67d128a02cb1ccb4a0abbdb0' });

  const mockDish = { _id: '68157dd418a6b80afd2e90c0', store: { _id: '67c6e409f1c07122e88619d6' } };
  const mockToppingGroups = [{ toppings: [{ _id: '67dc1f22fa72c3f295e43434' }, { _id: '67e4bdc17d122ca7f70e9030' }] }];
  const mockCart = { save: jest.fn() };

  Dish.findById.mockResolvedValue(mockDish);
  ToppingGroup.find.mockResolvedValue(mockToppingGroups);
  Cart.findOne.mockResolvedValue(null);
  Cart.create.mockResolvedValue(mockCart);

  await updateCart(req, res);
  expect(res.status).toHaveBeenCalledWith(201);
});

// TC_B5: Missing userId (updateCart)
test('TC_B5 - should return 401 if userId is missing (updateCart)', async () => {
  const { req, res } = mockReqRes({
    storeId: '67c6e409f1c07122e88619d6',
    dishId: '68157dd418a6b80afd2e90c0',
    quantity: 1
  }, null);
  await updateCart(req, res);
  expect(res.status).toHaveBeenCalledWith(401);
});

// TC_B6: Missing dishId or quantity (updateCart)
test('TC_B6 - should return 400 if dishId or quantity is missing (updateCart)', async () => {
  const { req, res } = mockReqRes({
    storeId: '67c6e409f1c07122e88619d6'
  }, { _id: '67d128a02cb1ccb4a0abbdb0' });
  await updateCart(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});

// TC_B7: Dish not found (updateCart)
test('TC_B7 - should return 400 if dish not found (updateCart)', async () => {
  const { req, res } = mockReqRes({
    storeId: '67c6e409f1c07122e88619d6',
    dishId: 'nonexistent',
    quantity: 1
  }, { _id: '67d128a02cb1ccb4a0abbdb0' });
  Dish.findById.mockResolvedValue(null);
  await updateCart(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});

// TC_B8: Dish not in the store (updateCart)
test('TC_B8 - should return 400 if dish does not belong to store (updateCart)', async () => {
  const { req, res } = mockReqRes({
    storeId: 'storeA',
    dishId: 'dish1',
    quantity: 1
  }, { _id: '67d128a02cb1ccb4a0abbdb0' });
  Dish.findById.mockResolvedValue({ _id: 'dish1', store: { _id: 'storeB' } });
  await updateCart(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});

// TC_B9: Happy path from updateCart to completeCart

test('TC_B9 - should create cart then complete it successfully', async () => {
  const userId = '67d128a02cb1ccb4a0abbdb0';
  const storeId = '67c6e409f1c07122e88619d6';

  const cartData = {
    _id: 'cart123',
    user: userId,
    store: storeId,
    items: [
      {
        dish: '68157dd418a6b80afd2e90c0',
        quantity: 1,
        toppings: [
          '67dc1f22fa72c3f295e43434',
          '67e4bdc17d122ca7f70e9030',
          '67fe540c3cf6b4b8d427de47',
          '67cb03465ebf58c06f0f3146',
          '67cd62e709defde4ea8bc46a'
        ]
      }
    ]
  };

  // updateCart mocks
  Dish.findById.mockResolvedValue({ _id: '68157dd418a6b80afd2e90c0', store: { _id: storeId } });
  ToppingGroup.find.mockResolvedValue([{ toppings: cartData.items[0].toppings.map(id => ({ _id: id })) }]);
  Cart.findOne.mockResolvedValueOnce(null); // for updateCart
  Cart.create.mockResolvedValue(cartData);

  // completeCart mocks
  Cart.findOne.mockResolvedValueOnce(cartData); // for completeCart
  Store.findById.mockResolvedValue({ _id: storeId, owner: 'owner123', name: 'Test Store' });
  Order.create.mockResolvedValue({ _id: 'order123' });
  Cart.findByIdAndDelete.mockResolvedValue(true);
  Notification.create.mockResolvedValue(true);

  const updateReqRes = mockReqRes({
    storeId,
    dishId: '68157dd418a6b80afd2e90c0',
    quantity: 1,
    toppings: cartData.items[0].toppings
  }, { _id: userId });

  await updateCart(updateReqRes.req, updateReqRes.res);
  expect(updateReqRes.res.status).toHaveBeenCalledWith(201);

  const completeReqRes = mockReqRes({
    storeId,
    paymentMethod: 'cash',
    deliveryAddress: 'Đường A1, Phường Tân Thới Nhất, Quận 12, Thành phố Hồ Chí Minh, 71509, Việt Nam',
    customerName: 'SYSTEM TESTER',
    customerPhonenumber: '0123456789',
    detailAddress: '',
    note: '',
    location: [106.6195634, 10.8248844]
  }, { _id: userId });

  await completeCart(completeReqRes.req, completeReqRes.res);
  expect(completeReqRes.res.status).toHaveBeenCalledWith(201);
})