const FoodType = require("./shared/model/foodType");
const ToppingGroup = require("./shared/model/toppingGroup");
const Topping = require("./shared/model/topping");
const Store = require("./shared/model/store");
const Dish = require("./shared/model/dish");
const Category = require("./shared/model/category");

const { getPaginatedData } = require("./shared/utils/paging");

const getAllCategory = async (req, res) => {
  try {
    const { name, limit, page } = req.query;
    let filterOptions = {};
    if (name) {
      filterOptions.name = { $regex: name, $options: "i" };
    }
    const response = await getPaginatedData(Category, filterOptions, null, limit, page);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    // Truy vấn danh sách món ăn
    const category = await Category.findById(category_id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Topping group not found",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid format",
      });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

const createCategory = async (req, res) => {
  try {
    const { store_id } = req.params;
    const { name } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Check if store exists
    const existingStore = await Store.findById(store_id);
    if (!existingStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Create new category
    const newCategory = new Category({
      name,
      store: store_id, // Assigning the store ID from params
    });

    // Save to database
    const savedCategory = await newCategory.save();

    res.status(201).json({ message: "Category created", category: savedCategory });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { category_id } = req.params;
    const { name } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Find and update category
    const updatedCategory = await Category.findByIdAndUpdate(
      category_id,
      { name },
      { new: true } // Return updated document
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category updated", category: updatedCategory });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    // Check if the category is used in any dish
    const dishesUsingCategory = await Dish.countDocuments({
      category: category_id,
    });

    if (dishesUsingCategory > 0) {
      return res.status(400).json({
        message: "Cannot delete category, it is used in one or more dishes",
        data: dishesUsingCategory,
      });
    }

    // Find and delete category
    const deletedCategory = await Category.findByIdAndDelete(category_id);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllCategory,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
