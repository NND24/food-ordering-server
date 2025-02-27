const mongoose = require("mongoose");
const { Dish, Store, ToppingGroup, Staff, Order, Rating } = require("./services/store/store.model"); // Ensure correct path
const connectDB = require("./config/connectDB");
require("dotenv").config();

const storeOwnerId = new mongoose.Types.ObjectId("67ba0ddde145d9ad24039666");

async function resetAndSeedData() {
    try {
        await connectDB(); // Ensure DB connection

        // Delete all previous data
        await Store.deleteMany({});
        await Dish.deleteMany({});
        await ToppingGroup.deleteMany({});
        await Staff.deleteMany({});
        await Order.deleteMany({});
        await Rating.deleteMany({});

        console.log("Previous data deleted.");

        // Insert Store
        const store = await Store.create({
            name: "Tasty Bites",
            owner: storeOwnerId,
            description: "A great place for fast food.",
            address: { full_address: "123 Main St", lat: 40.7128, lon: -74.006 },
            storeCategory: [],
            paperWork: {
                IC_front: { url: "ic_front.jpg", filePath: "/uploads/ic_front.jpg" },
                IC_back: { url: "ic_back.jpg", filePath: "/uploads/ic_back.jpg" },
            },
        });

        // Insert Categories
        const category1 = new mongoose.Types.ObjectId();
        const category2 = new mongoose.Types.ObjectId();

        // Insert Topping Groups
        const toppingGroup1 = await ToppingGroup.create({
            name: "Cheese Add-ons",
            store: store._id,
            toppings: [{ name: "Extra Cheese", price: 1.5 }, { name: "Cheddar", price: 2.0 }]
        });

        const toppingGroup2 = await ToppingGroup.create({
            name: "Sauce Selection",
            store: store._id,
            toppings: [{ name: "BBQ Sauce", price: 0.5 }, { name: "Spicy Mayo", price: 0.8 }]
        });

        const toppingGroup3 = await ToppingGroup.create({
            name: "Veggie Toppings",
            store: store._id,
            toppings: [{ name: "Lettuce", price: 0.5 }, { name: "Tomato", price: 0.7 }]
        });

        // Insert Dishes
        const dish1 = await Dish.create({
            name: "Cheeseburger",
            price: 5.99,
            category: category1,
            store: store._id,
            image: { url: "cheeseburger.jpg", filePath: "/uploads/cheeseburger.jpg" },
            toppingGroups: [toppingGroup1._id, toppingGroup2._id]
        });

        const dish2 = await Dish.create({
            name: "Veggie Burger",
            price: 6.99,
            category: category2,
            store: store._id,
            image: { url: "veggieburger.jpg", filePath: "/uploads/veggieburger.jpg" },
            toppingGroups: [toppingGroup3._id]
        });

        // Insert Staff
        await Staff.create([
            { name: "Alice", role: "manager", store: store._id, contact: { phone: "1234567890", email: "alice@example.com" } },
            { name: "Bob", role: "staff", store: store._id, contact: { phone: "0987654321", email: "bob@example.com" } }
        ]);

        // Insert Orders with different statuses
        const statuses = ["preorder", "pending", "confirmed", "preparing", "finished", "delivered", "cancelled"];
        const orders = statuses.map(status => ({
            customer: new mongoose.Types.ObjectId(),
            store: store._id,
            items: [{ dish: dish1._id, quantity: 2, toppings: [toppingGroup1.toppings[0]._id] }],
            totalAmount: 12.99,
            status,
            paymentMethod: "cash"
        }));

        await Order.insertMany(orders);

        // Insert Ratings
        const ratings = [
            { user: new mongoose.Types.ObjectId(), dish: dish1._id, store: store._id, ratingValue: 5, comment: "Amazing burger!" },
            { user: new mongoose.Types.ObjectId(), dish: dish1._id, store: store._id, ratingValue: 4, comment: "Tasty, but a bit expensive." },
            { user: new mongoose.Types.ObjectId(), dish: dish2._id, store: store._id, ratingValue: 3, comment: "Decent, but could use more flavor." },
            { user: new mongoose.Types.ObjectId(), dish: dish2._id, store: store._id, ratingValue: 5, comment: "Best veggie burger I've had!" }
        ];

        await Rating.insertMany(ratings);

        console.log("Example data seeded successfully.");
        mongoose.disconnect();
    } catch (error) {
        console.error("Error seeding data:", error);
        mongoose.disconnect();
    }
}

resetAndSeedData();
