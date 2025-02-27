const mongoose = require("mongoose");

// Dish Schema
var dishSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
        },
        image: {
            url: String,
            filePath: String,
        },
        toppingGroups: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "ToppingGroup", // Reference the ToppingGroup model
            }
        ],
    },
    { timestamps: true }
);


// Store Schema
var storeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        description: String,
        address: {
            full_address: String,
            lat: Number,
            lon: Number,
        },
        storeCategory: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
        }],
        paperWork: {
            IC_front: { url: String, filePath: String },
            IC_back: { url: String, filePath: String },
            businessLicense: { url: String, filePath: String },
            storePicture: { url: String, filePath: String },
        },
    },
    { timestamps: true }
);


// Topping Group Schema
var toppingGroupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
        },
        toppings: [
            {
                name: { type: String, required: true },
                price: { type: Number, required: true },
            }
        ]
    },
    { timestamps: true }
);

// Order Schema
var orderSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
        },
        items: [
            {
                dish: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Dish",
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                toppings: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Topping",
                }],
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["preorder", "pending", "confirmed", "preparing", "finished", "taken" ,"delivered", "cancelled"],
            default: "pending",
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "bank_transfer"],
        },
    },
    { timestamps: true }
);

// Staff Schema
var staffSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["manager", "staff"],
            required: true,
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
        },
        contact: {
            phone: String,
            email: String,
        },
    },
    { timestamps: true }
);

// Order Schema
var orderSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
        },
        items: [
            {
                dish: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Dish",
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                toppings: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Topping",
                }],
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["preorder", "pending", "confirmed", "preparing", "finished", "delivered", "cancelled"],
            default: "pending",
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "credit_card"],
        },
    },
    { timestamps: true }
);


var ratingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        dish: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dish",
            required: true,
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
        },
        ratingValue: {
            type: Number,
            required: true,
            min: 1,
            max: 5, // 1-5 star rating system
        },
        comment: {
            type: String,
            default: "", // Empty string if no comment
        },
    },
    { timestamps: true }
);

var categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    dishes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Dish" }]
});

// Method to calculate average rating for a dish
ratingSchema.statics.getAverageRating = async function (dishId) {
    const result = await this.aggregate([
        { $match: { dish: dishId } },
        { $group: { _id: "$dish", avgRating: { $avg: "$ratingValue" }, count: { $sum: 1 } } },
    ]);
    return result.length > 0 ? result[0] : { avgRating: 0, count: 0 };
};

// Method to calculate average rating for a store
ratingSchema.statics.getStoreRatingSummary = async function (storeId) {
    const result = await this.aggregate([
        { $match: { store: storeId } },
        { $group: { _id: "$store", avgRating: { $avg: "$ratingValue" }, count: { $sum: 1 } } },
    ]);
    return result.length > 0 ? result[0] : { avgRating: 0, count: 0 };
};


module.exports = {
    Dish: mongoose.model("Dish", dishSchema),
    Store: mongoose.model("Store", storeSchema),
    ToppingGroup: mongoose.model("ToppingGroup", toppingGroupSchema),
    Staff: mongoose.model("Staff", staffSchema),
    Order: mongoose.model("Order", orderSchema),
    Rating: mongoose.model("Rating", ratingSchema),
    Category: mongoose.model("Category", categorySchema)
};
