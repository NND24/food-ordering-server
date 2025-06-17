const { getAllStore } = require("../controller");
const Store = require("../shared/model/store");
const Rating = require("../shared/model/rating");
const Order = require("../shared/model/order");

jest.mock("../shared/model/store");
jest.mock("../shared/model/rating");
jest.mock("../shared/model/order");

function mockReqRes(query = {}) {
  const req = { query };
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const res = { status };
  return { req, res, json, status };
}

describe("getAllStore", () => {
  const mockStores = [
    {
      _id: "1",
      name: "Store A",
      storeCategory: "cat1",
      address: { lat: 10, lon: 106 },
    },
    {
      _id: "2",
      name: "Store B",
      storeCategory: "cat2",
      address: { lat: 11, lon: 106.5 },
    },
  ];

  const mockRatings = [
    { _id: "1", avgRating: 4.5, amountRating: 10 },
    { _id: "2", avgRating: 3.8, amountRating: 5 },
  ];

  const mockOrders = [
    { _id: "1", orderCount: 15 },
    { _id: "2", orderCount: 7 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return all stores with rating", async () => {
    Store.find.mockReturnValue({
      populate: () => ({
        lean: () => Promise.resolve(mockStores),
      }),
    });
    Rating.aggregate.mockResolvedValue(mockRatings);

    const { req, res } = mockReqRes({});
    await getAllStore(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status().json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 2,
        data: expect.arrayContaining([
          expect.objectContaining({
            name: "Store A",
            avgRating: 4.5,
            amountRating: 10,
          }),
        ]),
      })
    );
  });

  test("should filter by name", async () => {
    Store.find.mockImplementation((filter) => {
      expect(filter.name).toEqual({ $regex: "Store A", $options: "i" });
      return {
        populate: () => ({
          lean: () => Promise.resolve([mockStores[0]]),
        }),
      };
    });
    Rating.aggregate.mockResolvedValue(mockRatings);

    const { req, res } = mockReqRes({ name: "Store A" });
    await getAllStore(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status().json).toHaveBeenCalledWith(
      expect.objectContaining({ total: 1 })
    );
  });

  // test("should filter by name", async () => {
  //   const store = {
  //     _id: "1",
  //     name: "Store A",
  //     storeCategory: "cat1",
  //     address: { lat: 10, lon: 106 },
  //   };

  //   Store.find.mockImplementation(() => ({
  //     populate: () => ({
  //       lean: () => Promise.resolve([store]),
  //     }),
  //   }));

  //   Rating.aggregate.mockResolvedValue([
  //     { _id: "1", avgRating: 4.5, amountRating: 10 },
  //   ]);

  //   const { req, res } = mockReqRes({ name: "Store A" });
  //   await getAllStore(req, res);

  //   expect(res.status).toHaveBeenCalledWith(200);
  //   expect(res.status().json).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       total: 1,
  //       data: expect.arrayContaining([
  //         expect.objectContaining({ name: "Store A" }),
  //       ]),
  //     })
  //   );
  // });

  test("should filter by category", async () => {
    Store.find.mockImplementation((filter) => {
      expect(filter.storeCategory).toEqual({ $in: ["cat1", "cat2"] });
      return {
        populate: () => ({
          lean: () => Promise.resolve(mockStores),
        }),
      };
    });
    Rating.aggregate.mockResolvedValue(mockRatings);

    const { req, res } = mockReqRes({ category: "cat1,cat2" });
    await getAllStore(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("should apply sort by rating", async () => {
    Store.find.mockReturnValue({
      populate: () => ({
        lean: () => Promise.resolve(mockStores),
      }),
    });
    Rating.aggregate.mockResolvedValue(mockRatings);

    const { req, res } = mockReqRes({ sort: "rating" });
    await getAllStore(req, res);

    const result = res.status().json.mock.calls[0][0];
    expect(result.data[0].avgRating).toBeGreaterThanOrEqual(
      result.data[1].avgRating
    );
  });

  test("should apply sort by standout", async () => {
    Store.find.mockReturnValue({
      populate: () => ({
        lean: () => Promise.resolve(mockStores),
      }),
    });
    Rating.aggregate.mockResolvedValue(mockRatings);
    Order.aggregate.mockResolvedValue(mockOrders);

    const { req, res } = mockReqRes({ sort: "standout" });
    await getAllStore(req, res);

    const result = res.status().json.mock.calls[0][0];
    expect(result.data[0].orderCount).toBeGreaterThanOrEqual(
      result.data[1].orderCount
    );
  });

  test("should apply sort by name", async () => {
    Store.find.mockReturnValue({
      populate: () => ({
        lean: () => Promise.resolve(mockStores),
      }),
    });
    Rating.aggregate.mockResolvedValue(mockRatings);

    const { req, res } = mockReqRes({ sort: "name" });
    await getAllStore(req, res);

    const result = res.status().json.mock.calls[0][0];
    expect(
      result.data[0].name.localeCompare(result.data[1].name)
    ).toBeLessThanOrEqual(0);
  });

  test("should filter nearby stores within 70km", async () => {
    Store.find.mockReturnValue({
      populate: () => ({
        lean: () => Promise.resolve(mockStores),
      }),
    });
    Rating.aggregate.mockResolvedValue(mockRatings);

    const { req, res } = mockReqRes({ lat: "10", lon: "106" });
    await getAllStore(req, res);

    const result = res.status().json.mock.calls[0][0];
    expect(result.data.every((s) => s.distance <= 70)).toBe(true);
  });

  test("should apply pagination", async () => {
    Store.find.mockReturnValue({
      populate: () => ({
        lean: () => Promise.resolve(mockStores),
      }),
    });
    Rating.aggregate.mockResolvedValue(mockRatings);

    const { req, res } = mockReqRes({ limit: "1", page: "1" });
    await getAllStore(req, res);

    const result = res.status().json.mock.calls[0][0];
    expect(result.pageSize).toBe(1);
    expect(result.currentPage).toBe(1);
    expect(result.data.length).toBe(1);
  });

  test("should handle internal server error", async () => {
    Store.find.mockImplementation(() => {
      throw new Error("Something went wrong");
    });

    const { req, res } = mockReqRes();
    await getAllStore(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status().json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Something went wrong",
      })
    );
  });
  test("should only return stores with status APPROVED", async () => {
    Store.find.mockImplementation((filter) => {
      expect(filter.status).toBe("APPROVED");
      return {
        populate: () => ({
          lean: () =>
            Promise.resolve([
              {
                _id: "1",
                name: "A",
                storeCategory: "cat1",
                address: { lat: 10, lon: 106 },
              },
            ]),
        }),
      };
    });

    Rating.aggregate.mockResolvedValue([
      { _id: "1", avgRating: 5, amountRating: 2 },
    ]);

    const { req, res } = mockReqRes();
    await getAllStore(req, res);

    const result = res.status().json.mock.calls[0][0];
    expect(result.total).toBe(1);
    expect(result.data[0].name).toBe("A");
  });

  test("should assign Infinity distance when store address is missing", async () => {
    const stores = [
      { _id: "1", name: "No Address", storeCategory: "cat1", address: {} },
    ];
    Store.find.mockReturnValue({
      populate: () => ({
        lean: () => Promise.resolve(stores),
      }),
    });
    Rating.aggregate.mockResolvedValue([]);

    const { req, res } = mockReqRes({ lat: "10", lon: "106" });
    await getAllStore(req, res);

    const result = res.status().json.mock.calls[0][0];
    expect(result.data).toHaveLength(0); // Vì distance = Infinity nên bị filter ra
  });
  test("should assign default rating and orderCount if not found", async () => {
    Store.find.mockReturnValue({
      populate: () => ({
        lean: () => Promise.resolve(mockStores),
      }),
    });
    Rating.aggregate.mockResolvedValue([]);
    Order.aggregate.mockResolvedValue([]);

    const { req, res } = mockReqRes({ sort: "standout" });
    await getAllStore(req, res);

    const result = res.status().json.mock.calls[0][0];
    result.data.forEach((store) => {
      expect(store.avgRating).toBe(0);
      expect(store.amountRating).toBe(0);
      expect(store.orderCount).toBe(0);
    });
  });
  test("should return empty array for out-of-bound page", async () => {
    Store.find.mockReturnValue({
      populate: () => ({
        lean: () => Promise.resolve(mockStores),
      }),
    });
    Rating.aggregate.mockResolvedValue(mockRatings);

    const { req, res } = mockReqRes({ limit: "1", page: "99" });
    await getAllStore(req, res);

    const result = res.status().json.mock.calls[0][0];
    expect(result.data).toEqual([]);
  });
  test("should match name with Vietnamese tones removed", async () => {
    const stores = [
      { _id: "1", name: "Cà phê Ông Đạt", storeCategory: "cat1", address: {} },
    ];
    Store.find.mockReturnValue({
      populate: () => ({
        lean: () => Promise.resolve(stores),
      }),
    });
    Rating.aggregate.mockResolvedValue([]);

    const { req, res } = mockReqRes({ name: "ca phe ong dat" });
    await getAllStore(req, res);

    const result = res.status().json.mock.calls[0][0];
    expect(result.total).toBe(1);
  });
});
