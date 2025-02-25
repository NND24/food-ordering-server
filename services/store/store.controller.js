const Store = require("./store.model");
const createError = require("../../utils/createError");
const asyncHandler = require("express-async-handler");
const { query } = require("express");

const getAllDish = asyncHandler(async (req, res, next ) =>{
    try {
        const getDishes = await Dish.find(query).select
    }
})
