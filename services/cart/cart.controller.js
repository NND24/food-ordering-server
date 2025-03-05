const { Cart } = require("./cart.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");
const { query } = require("express");
const mongoose = require("mongoose");
const { Dish } = require("../store/store.model");
const { Order } = require("../order/order.model")

// [GET] /#
const getUserCart = async (req, res) => {
    try {
        const userId = req?.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }
        // Tạo bộ lọc tìm kiếm
        let filter = { user: userId };

        // Truy vấn danh sách món ăn
        const cart = await Cart.find(filter);
        if (!cart || cart.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart not found",
            });
        }

        res.status(200).json({
            success: true,
            data: cart,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message });
    }
}

const increaseQuantity = async (req, res) => {
    try {
        const userId = req?.user?._id;
        const { storeId, dishId, quantity } = req.body;
        const toppings = []
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }
        if (!storeId || !dishId) {
            return res.status(400).json({
                success: false,
                message: "Invalid request body",
            });
        }
        // Check if the dish belong to that store
        let dish = await Dish.findById(dishId)
        if (!dish) {         
            return res.status(400).json({
                success: false,
                message: "Dish not exsited in system",
            });
        }
        if (dish.store._id != storeId) {
            return res.status(400).json({
                success: false,
                message: "Dish not exsited in the store",
            });
        }

        // Check if cart exists for the user
        let cart = await Cart.findOne({ user: userId, store: storeId });

        if (!cart) {
            // If no cart exists, create a new cart with the item
            cart = await Cart.create({
                user: userId,
                store: storeId,
                items: [{ dish: dishId, quantity: quantity ? quantity : 1, topping: toppings }]
            });

            return res.status(201).json({
                success: true,
                message: "New cart created with item",
                data: cart,
            });
        }

        // Check if the item already exists in the cart
        let itemIndex = cart.items.findIndex(item => item.dish.toString() === dishId);

        if (itemIndex > -1) {
            // Item exists, increase quantity
            cart.items[itemIndex].quantity += quantity ? quantity : 1;
        } else {
            // Item does not exist, add new item
            cart.items.push({ dish: dishId, quantity: quantity ? quantity : 1, topping: toppings });
        }

        // Save the updated cart
        await cart.save();

        res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            data: cart,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const decreaseQuantity = async (req, res) => {
    try {
        const userId = req?.user?._id;
        const { storeId, dishId } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }
        if (!storeId || !dishId) {
            return res.status(400).json({
                success: false,
                message: "Invalid request body",
            });
        }
        // Check if the dish belong to that store
        let dish = await Dish.findById(dishId)
        if (!dish) {         
            return res.status(400).json({
                success: false,
                message: "Dish not exsited in system",
            });
        }
        if (dish.store._id != storeId) {
            return res.status(400).json({
                success: false,
                message: "Dish not exsited in the store",
            });
        }
        // Find the user's cart
        let cart = await Cart.findOne({ user: userId, store: storeId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found",
            });
        }

        // Find the item in the cart
        let itemIndex = cart.items.findIndex(item => item.dish.toString() === dishId);

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart",
            });
        }

        // Decrease quantity
        if (cart.items[itemIndex].quantity > 1) {
            cart.items[itemIndex].quantity -= 1;
        } else {
            // If quantity is 1, remove the item from the cart
            cart.items.splice(itemIndex, 1);
        }

        // If the cart is empty after removing the item, delete the cart
        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            return res.status(200).json({
                success: true,
                message: "Cart is now empty and has been deleted",
            });
        }

        // Save the updated cart
        await cart.save();

        res.status(200).json({
            success: true,
            message: "Item quantity decreased",
            data: cart,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const clearItem = async (req, res) => {
    try {
        const userId = req?.user?._id;
        let { dish_id } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if (!dish_id) {
            return res.status(400).json({ success: false, message: "Dish ID is required" });
        }

        // Convert dish_id to ObjectId if necessary
        if (!mongoose.Types.ObjectId.isValid(dish_id)) {
            return res.status(400).json({ success: false, message: "Invalid Dish ID" });
        }
        dish_id = new mongoose.Types.ObjectId(dish_id);

        // Find the user's cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        // Remove the dish from the cart
        cart.items = cart.items.filter(item => item.dish.toString() !== dish_id.toString());

        // If the cart is empty after deletion, remove the entire cart
        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            return res.status(200).json({ success: true, message: "Cart is now empty and has been deleted" });
        }

        // Save the updated cart
        await cart.save();

        return res.status(200).json({ success: true, message: "Item removed from cart", data: cart.items });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};





const clearCart = async (req, res) => {
    try {
        const userId = req?.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        // Find and delete the cart
        const deletedCart = await Cart.findOneAndDelete({ user: userId });

        if (!deletedCart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        res.status(200).json({ success: true, message: "Cart cleared successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const completeCart = async (req, res) => {
    try {
        const userId = req?.user?._id;
        const { storeId, paymentMethod, deliveryAddress, location = [] } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        if (!storeId || !paymentMethod || !deliveryAddress || !location) {
            return res.status(400).json({ success: false, message: "Invalid request body" });
        }
        const cart = await Cart.findOne({ user: userId });
        if (!cart || !cart.items.length) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }
        const newOrder = new Order({
            user: userId,
            store: storeId,
            items: cart.items, // Copy cart items to order
            totalPrice: cart.totalPrice,
            shipLocation:{
                type: "Point",
                coordinates : location,
                address: deliveryAddress
            },
            status: "pending", // Default status for a new order
            paymentMethod: paymentMethod,
            createdAt: new Date()
        });
        await newOrder.save(); // Save order to DB

        await Cart.findOneAndDelete({ user: userId });

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: newOrder
        });


    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
}



module.exports = { getUserCart, increaseQuantity, decreaseQuantity, clearItem, clearCart, completeCart };