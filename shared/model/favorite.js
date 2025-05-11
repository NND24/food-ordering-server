const mongoose = require("mongoose")

// Favorite schema

var favoriteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            require: true
        },
        store: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            require: false
        }],
    }
)

module.exports = {
    Favorite: mongoose.model("Favorite", favoriteSchema),
}