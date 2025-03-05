const mongoose = require("mongoose");
const { Dish, Store, ToppingGroup, Staff, Rating, Category } = require("./services/store/store.model");
const { Order } = require("./services/order/order.model");
const { Favorite } = require("./services/favorite/favorite.model");
const { Cart } = require("./services/cart/cart.model");

const connectDB = require("./config/connectDB");
require("dotenv").config();

const storeOwnerId = new mongoose.Types.ObjectId("67b9bbcae484417433f0d010");
const userId1 = new mongoose.Types.ObjectId("67ba0ddde145d9ad24039666");
const userId2 = new mongoose.Types.ObjectId("67baf94d2f34b1faaae0c23e");
const staffId = new mongoose.Types.ObjectId();
const orderId = new mongoose.Types.ObjectId();

async function resetAndSeedData() {
    try {
        await connectDB();

        // Delete all previous data
        await Store.deleteMany({});
        await Dish.deleteMany({});
        await ToppingGroup.deleteMany({});
        await Staff.deleteMany({});
        await Order.deleteMany({});
        await Rating.deleteMany({});
        await Category.deleteMany({});
        await Cart.deleteMany({});
        await Favorite.deleteMany({});

        console.log("Previous data deleted.");

        // Insert Stores
        const store1 = await Store.create({
            name: "Tasty Bites",
            owner: storeOwnerId,
            description: "A great place for fast food.",
            address: { full_address: "123 Main St", lat: 40.7128, lon: -74.006 },
            storeCategory: [],
        });

        const store2 = await Store.create({
            name: "Healthy Eats",
            owner: storeOwnerId,
            description: "Nutritious and delicious meals.",
            address: { full_address: "456 Elm St", lat: 40.722, lon: -74.015 },
            storeCategory: [],
        });

        // Insert Categories
        const category1 = await Category.create({ name: "Burgers", store: store1._id });
        const category2 = await Category.create({ name: "Vegetarian", store: store2._id });

        // Insert Topping Groups
        const topping1Id = new mongoose.Types.ObjectId();
        const topping2Id = new mongoose.Types.ObjectId();

        const toppingGroup1 = await ToppingGroup.create({
            name: "Cheese Add-ons",
            store: store1._id,
            toppings: [{ _id: topping1Id, name: "Extra Cheese", price: 1.5 }]
        });

        const toppingGroup2 = await ToppingGroup.create({
            name: "Sauces",
            store: store2._id,
            toppings: [{ _id: topping2Id, name: "BBQ Sauce", price: 0.5 }]
        });

        // Insert Dishes
        const dish1 = await Dish.create({
            name: "Cheeseburger",
            price: 5.99,
            category: category1._id,
            store: store1._id,
            image: { url: "cheeseburger.jpg", filePath: "/uploads/cheeseburger.jpg" },
            toppingGroups: [toppingGroup1._id]
        });

        const dish2 = await Dish.create({
            name: "Veggie Wrap",
            price: 6.99,
            category: category2._id,
            store: store2._id,
            image: { url: "veggie_wrap.jpg", filePath: "/uploads/veggie_wrap.jpg" },
            toppingGroups: [toppingGroup2._id]
        });

        // Update category with dishes
        await Category.findByIdAndUpdate(category1._id, { $push: { dishes: dish1._id } });
        await Category.findByIdAndUpdate(category2._id, { $push: { dishes: dish2._id } });

        // Insert Staff
        await Staff.create({
            _id: staffId,
            name: "John Doe",
            role: "manager",
            store: store1._id
        });

        // Insert Orders with Google Maps-style locations
        await Order.create({
            _id: orderId,
            user: userId1,
            store: store1._id,
            items: [{ dish: dish1._id, quantity: 1, toppings: [topping1Id] }],
            shipLocation: {
                type: "Point",
                coordinates: [-74.0059, 40.7127], // New York City (longitude, latitude)
                address: "123 Sth Streets"
            },
            status: "pending",
            paymentMethod: "cash"
        });

        await Order.create({
            user: userId2,
            store: store2._id,
            items: [{ dish: dish2._id, quantity: 2, toppings: [topping2Id] }],
            shipLocation: {
                type: "Point",
                coordinates: [-74.015, 40.722], // Another NYC location
                address: "123 Sth Streets"
            },
            status: "confirmed",
            paymentMethod: "credit_card"
        });

        // Insert Ratings
        await Rating.create({
            user: userId1,
            dish: dish1._id,
            store: store1._id,
            ratingValue: 4,
            comment: "Great food!"
        });

        await Rating.create({
            user: userId2,
            dish: dish1._id,
            store: store2._id,
            ratingValue: 5,
            comment: "Amazing healthy options."
        });

        // Insert Carts
        await Cart.create({
            user: userId1,
            store: store1._id,
            items: [{ dish: dish1._id, quantity: 2, toppings: [topping1Id] }]
        });

        await Cart.create({
            user: userId2,
            store: store2._id,
            items: [{ dish: dish2._id, quantity: 1, toppings: [topping2Id] }]
        });

        // Insert Favorite Stores
        await Favorite.create({ user: userId1, store: [store1._id] });
        await Favorite.create({ user: userId2, store: [store2._id] });

        console.log("Example data seeded successfully.");
        mongoose.disconnect();
    } catch (error) {
        console.error("Error seeding data:", error);
        mongoose.disconnect();
    }
}

resetAndSeedData();
