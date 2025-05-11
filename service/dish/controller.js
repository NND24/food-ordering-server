const Dish = require("./shared/model/dish");

const { getPaginatedData } = require("./shared/utils/paging");

const getAllDish = async (req, res) => {
  try {
    const { store_id } = req.params;
    const { name, limit, page } = req.query;

    let filterOptions = { store: store_id };
    if (name) filterOptions.name = { $regex: name, $options: "i" };
    const response = await getPaginatedData(
      Dish,
      filterOptions,
      [
        { path: "category", select: "name" },
        {
          path: "toppingGroups",
          select: "name toppings",
          populate: { path: "toppings", select: "name price" }, // Correctly populates toppings inside toppingGroups
        },
      ],
      limit,
      page
    );

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDish = async (req, res) => {
  try {
    const { dish_id } = req.params;

    // Truy vấn danh sách món ăn
    const dish = await Dish.findById(dish_id).populate([
      { path: "category", select: "name" },
      {
        path: "toppingGroups",
        select: "name toppings",
        populate: { path: "toppings", select: "name price" }, // Correctly populates toppings inside toppingGroups
      },
    ]);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    res.status(200).json({
      success: true,
      data: dish,
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

const updateDish = async (req, res) => {
  try {
    const { dish_id } = req.params; // Get order ID from the request parameters
    const updatedData = req.body; // Get the updated data from the request body

    // Ensure the order exists
    const dish = await Dish.findById(dish_id).populate([
      { path: "category", select: "name" },
      {
        path: "toppingGroups",
        select: "name toppings",
        populate: { path: "toppings", select: "name price" }, // Correctly populates toppings inside toppingGroups
      },
    ]);
    if (!dish) {
      return res.status(404).json({ message: "Dish not found" });
    }

    // Update the order with new data
    Object.assign(dish, updatedData);
    await dish.save();

    return res.status(200).json({
      message: "Dish updated successfully",
      data: dish,
    });
  } catch (error) {
    console.error("Error updating dish:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const createDish = async (req, res) => {
  try {
    const { store_id } = req.params; // Get store ID from request parameters
    const dishData = req.body; // Get dish details from request body
    // Ensure required fields exist
    if (!dishData.name || !dishData.price) {
      return res
        .status(400)
        .json({ message: "Dish name and price are required" });
    }

    Object.keys(dishData).forEach((key) => {
      if (dishData[key] === "") {
        delete dishData[key];
      }
    });
    // Check if the dish with the same name already exists in the same store
    const existingDish = await Dish.findOne({
      name: dishData.name,
      store: store_id,
    });
    if (existingDish) {
      return res.status(400).json({
        message: "A dish with this name already exists in the store.",
      });
    }

    // Create new dish
    const newDish = new Dish({
      ...dishData,
      store: store_id, // Associate the dish with the store
    });

    // Save dish to database
    await newDish.save();

    return res.status(201).json({
      message: "Dish created successfully",
      data: newDish,
    });
  } catch (error) {
    console.error("Error creating dish:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const deleteDish = async (req, res) => {
  try {
    const { dish_id } = req.params;

    // Validate input
    if (!dish_id) {
      return res.status(400).json({ message: "Dish ID is required" });
    }

    // Check if the dish exists
    const dish = await Dish.findById(dish_id);
    if (!dish) {
      return res.status(404).json({ message: "Dish not found" });
    }

    // Delete the dish
    await Dish.findByIdAndDelete(dish_id);

    return res.status(200).json({
      message: "Dish deleted successfully",
      data: dish,
    });
  } catch (error) {
    console.error("Error deleting dish:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
    getAllDish,
    updateDish,
    createDish,
    deleteDish,
    getDish
}