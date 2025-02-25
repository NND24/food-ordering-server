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



module.exports = {
    Dish: mongoose.model("Dish", dishSchema),
    Store: mongoose.model("Store", storeSchema),
    ToppingGroup: mongoose.model("ToppingGroup", toppingGroupSchema),
    Staff: mongoose.model("Staff", staffSchema),
    Order: mongoose.model("Order", orderSchema),
};
