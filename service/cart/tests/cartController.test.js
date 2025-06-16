    const { completeCart } = require('../controller');
    const Cart = require('./../shared/model/cart');
    const Order = require('./../shared/model/order');
    const Notification = require('./../shared/model/notification');
    const Store = require('./../shared/model/store');

    jest.mock('./../shared/model/cart');
    jest.mock('./../shared/model/order');
    jest.mock('./../shared/model/notification');
    jest.mock('./../shared/model/store');
    jest.mock('../socketClient', () => ({
        emit: jest.fn(),
    }));
    function mockReqRes(body = {}, user = {}) {
    const req = { body, user };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };
    return { req, res, json, status };
    }

    test('should return 401 if userId is missing', async () => {
    const { req, res } = mockReqRes({ storeId: '123' }, null);
    await completeCart(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 if cart is empty', async () => {
    const { req, res } = mockReqRes({
        storeId: 'store123',
        paymentMethod: 'cash',
        deliveryAddress: '123 Street',
        location: [10, 20],
    }, { _id: 'user123' });

    

    Cart.findOne.mockResolvedValue(null);

    await completeCart(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should create an order and return 201', async () => {
        const mockCart = {
          items: [{ name: 'Pizza' }],
          totalPrice: 100,
        };
      
        const mockStore = {
          owner: 'owner123',
          staff: ['staff1', 'staff2'],
        };
      
        const mockOrder = {
          id: 'order123',
          customerName: 'John',
          totalPrice: 100,
          status: 'pending',
          createdAt: new Date(),
          save: jest.fn(),
        };
      
        const { req, res } = createMockReqRes({
          storeId: 'store123',
          paymentMethod: 'cash',
          customerName: 'John',
          customerPhonenumber: '0123456789',
          deliveryAddress: '123 Street',
          location: [10, 20],
        }, { _id: 'user123' });
      
        Cart.findOne.mockResolvedValue(mockCart);
        Store.findById.mockResolvedValue(mockStore);
        Order.prototype.save = jest.fn();
        Notification.prototype.save = jest.fn();
      
        await completeCart(req, res);
      
        expect(res.status).toHaveBeenCalledWith(201);
        expect(socket.emit).toHaveBeenCalled(); // check notification sent
      });
