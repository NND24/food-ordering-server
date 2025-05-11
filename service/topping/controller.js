const Store = require("./shared/model/store");
const ToppingGroup = require("./shared/model/topping");
const Topping = require("./shared/model/topping");

const { getPaginatedData } = require("./shared/utils/paging");

const getAllTopping = async (req, res) => {
  try {
    const { limit, page } = req.query;
    const { store_id } = req.params;
    let filterOptions = { store: store_id };

    const response = await getPaginatedData(
      ToppingGroup,
      filterOptions,
      [
        {
          path: "toppings",
          select: "name price",
          // populate: { path: "toppings", select: "name price" } // Correctly populates toppings inside toppingGroups
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
const getTopping = async (req, res) => {
  try {
    const { group_id } = req.params;

    // Truy vấn danh sách món ăn
    const toppingGroup = await ToppingGroup.findById(group_id).populate({
      path: "toppings",
      select: "-toppingGroup",
    });

    if (!toppingGroup) {
      return res.status(404).json({
        success: false,
        message: "Topping group not found",
      });
    }

    res.status(200).json({
      success: true,
      data: toppingGroup,
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
const addToppingGroup = async (req, res) => {
  try {
    const toppingGroup = req.body;
    const { store_id } = req.params;
    console.log("Store ID:", store_id);
    console.log("Topping Group:", toppingGroup);

    if (!toppingGroup.name || toppingGroup.name.trim() === "") {
      return res.status(400).json({ message: "Tên nhóm topping là bắt buộc." });
    }

    // Check if the topping group already exists
    const existingGroup = await ToppingGroup.findOne({
      name: toppingGroup.name.trim(),
    });
    if (existingGroup) {
      return res.status(409).json({ message: "Nhóm topping đã tồn tại." });
    }

    // Create new topping group
    const newGroup = new ToppingGroup({
      name: toppingGroup.name.trim(),
      store: store_id,
      toppings: [],
    });

    const savedGroup = await newGroup.save();
    return res.status(201).json(savedGroup);
  } catch (error) {
    console.error("Add Topping Group Error:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi thêm nhóm topping." });
  }
};
const addToppingToGroup = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { name, price } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Topping name and price are required",
      });
    }

    // Ensure price is stored as a Number
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice)) {
      return res.status(400).json({
        success: false,
        message: "Invalid price format",
      });
    }

    // Find the topping group
    let toppingGroup = await ToppingGroup.findById(group_id);
    if (!toppingGroup) {
      return res.status(404).json({
        success: false,
        message: "Topping group not found",
      });
    }

    // Create a new Topping document
    const newTopping = await Topping.create({
      name,
      price: parsedPrice,
      toppingGroup: group_id, // Associate it with the group
    });

    // Push the new topping's ObjectId to the toppingGroup
    toppingGroup.toppings.push(newTopping._id);
    await toppingGroup.save();

    return res.status(200).json({
      success: true,
      message: "Topping added successfully",
      data: newTopping, // Returning the created topping
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const updateTopping = async (req, res) => {
  try {
    const { group_id, topping_id } = req.params;
    const { name, price } = req.body;

    // Validate input
    if (!name || price == null) {
      return res
        .status(400)
        .json({ success: false, message: "Name and price are required" });
    }

    // Find and update the topping
    const updatedTopping = await Topping.findOneAndUpdate(
      { _id: topping_id, toppingGroup: group_id },
      { name, price },
      { new: true }
    );

    if (!updatedTopping) {
      return res
        .status(404)
        .json({ success: false, message: "Topping not found" });
    }

    res.status(200).json({ success: true, data: updatedTopping });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const removeToppingFromGroup = async (req, res) => {
  try {
    const { group_id, topping_id } = req.params;

    // Find the topping group
    let toppingGroup = await ToppingGroup.findById(group_id);
    if (!toppingGroup) {
      return res.status(404).json({
        success: false,
        message: "Topping group not found",
      });
    }

    // Find and remove the topping
    const initialLength = toppingGroup.toppings.length;
    toppingGroup.toppings = toppingGroup.toppings.filter(
      (topping) => topping._id.toString() !== topping_id
    );

    if (toppingGroup.toppings.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Topping not found in the group",
      });
    }

    // Save the updated group
    await toppingGroup.save();

    return res.status(200).json({
      success: true,
      message: "Topping removed successfully",
      data: toppingGroup,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const deleteToppingGroup = async (req, res) => {
  try {
    const { group_id } = req.params;

    const deletedGroup = await ToppingGroup.findByIdAndDelete(group_id);

    if (!deletedGroup) {
      return res.status(404).json({ message: "Không tìm thấy nhóm topping." });
    }

    return res.status(200).json({ message: "Xóa nhóm topping thành công." });
  } catch (error) {
    console.error("Delete Topping Group Error:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi xóa nhóm topping." });
  }
};
const createToppingGroup = async (req, res) => {
  try {
    const { store_id } = req.params;
    const { name, onlyOnce, toppings } = req.body;

    // Validate store_id
    const store = await Store.findById(store_id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // Create a new ToppingGroup
    const toppingGroup = new ToppingGroup({
      name,
      store: store_id,
      onlyOnce,
      toppings, // Expecting an array of toppings from request body
    });

    // Save to database
    await toppingGroup.save();

    return res.status(201).json({
      success: true,
      message: "Topping group created successfully",
      data: toppingGroup,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID format",
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
const getToppingFromDish = async (req, res) => {
  try {
    const { dish_id } = req.params;

    // Fetch the dish with its topping groups and toppings
    const dish = await Dish.findById(dish_id).populate({
      path: "toppingGroups",
      populate: {
        path: "toppings",
      },
    });

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    if (!dish.toppingGroups || dish.toppingGroups.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No topping groups found for this dish",
      });
    }

    // Sanitize: remove toppingGroup field from each topping
    const cleanedToppingGroups = dish.toppingGroups.map((group) => {
      const cleanedToppings = group.toppings.map((topping) => {
        const { toppingGroup, ...rest } = topping.toObject(); // Remove toppingGroup
        return rest;
      });
      return {
        ...group.toObject(),
        toppings: cleanedToppings,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Toppings retrieved successfully",
      data: cleanedToppingGroups,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid dish ID format",
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
const addToppingToDish = async (req, res) => {
  try {
    const { dish_id } = req.params;
    const { topping_ids } = req.body; // Expecting an array of topping IDs

    if (!Array.isArray(topping_ids) || topping_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Topping IDs must be a non-empty array",
      });
    }

    // Find the dish
    let dish = await Dish.findById(dish_id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Dish not found",
      });
    }

    // Find all topping groups that contain these toppings
    let toppingGroups = await ToppingGroup.find({
      "toppings._id": { $in: topping_ids },
    });

    if (!toppingGroups || toppingGroups.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid toppings found",
      });
    }

    // Extract valid toppings from the groups
    let validToppings = [];
    toppingGroups.forEach((group) => {
      let filteredToppings = group.toppings.filter((topping) => topping_ids.includes(topping._id.toString()));
      validToppings.push(...filteredToppings);
    });

    if (validToppings.length === 0) {
      return res.status(400).json({
        success: false,
        message: "None of the provided topping IDs are valid",
      });
    }

    // Ensure dish has a toppings field
    if (!dish.toppings) {
      dish.toppings = [];
    }

    // Filter out toppings that are already added to the dish
    let newToppings = validToppings.filter(
      (topping) => !dish.toppings.some((existingTopping) => existingTopping._id.toString() === topping._id.toString())
    );

    if (newToppings.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All provided toppings are already added to the dish",
      });
    }

    // Add new toppings to the dish
    dish.toppings.push(...newToppings);

    // Save the updated dish
    await dish.save();

    return res.status(200).json({
      success: true,
      message: "Toppings added to dish successfully",
      data: dish,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
  getAllTopping,
  getTopping,
  addToppingGroup,
  addToppingToGroup,
  updateTopping,
  removeToppingFromGroup,
  deleteToppingGroup,
  createToppingGroup,
  getToppingFromDish,
  addToppingToDish
};
