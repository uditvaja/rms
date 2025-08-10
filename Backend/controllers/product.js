const models = require("../models");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

const addProduct = async (req, res) => {
  try {
      const {
          itemName,
          ingredients,
          price,
          discount,
          type,
          spiceLevel,
          itemType,
          customizations,
          categoryId,
      } = req.body;

      const parsedCustomizations =
          typeof customizations === "string"
              ? JSON.parse(customizations)
              : customizations;

      let imageUrl = null;
      if (req.file) {
          const result = await cloudinary.uploader.upload(req.file.path, {
              folder: "menu_items", 
              use_filename: true, 
          });
          imageUrl = result.secure_url; 
          fs.unlink(req.file.path, (err) => {
              if (err) {
                  console.error("Error deleting local file:", err);
              } else {
                  console.log("Local file deleted after upload");
              }
          });
      }

      // Create new item object
      const newItem = {
          itemName,
          ingredients,
          price,
          discount,
          type,
          spiceLevel,
          itemType,
          customizations: parsedCustomizations,
          imageUrl,
          categoryId,
      };

      // Save new item
      const manageOrderDoc = new models.Product(newItem);
      await manageOrderDoc.save();

      res.status(201).json({
          message: "Item created successfully!",
          data: manageOrderDoc,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({
          message: "Failed to create item.",
          error: error.message || "An unknown error occurred",
      });
  }
};

const getProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await models.Product.findById(id).populate('categoryId');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}


const getAllProducts = async (req, res) => {
  try {
    const items = await models.Product.find().populate('categoryId');
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching items", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    let updatedItem = req.body;
    console.log("Received item to update:", updatedItem);

    if (typeof updatedItem.customizations === 'string') {
      try {
        updatedItem.customizations = JSON.parse(updatedItem.customizations);
      } catch (error) {
        console.error("Error parsing customizations:", error);
        if (updatedItem.customizations.includes('[object Object]')) {
          let cleanedString = updatedItem.customizations.replace(/\[object Object\]/g, '{}');
          try {
            updatedItem.customizations = JSON.parse(`[${cleanedString}]`);
          } catch (innerError) {
            return res.status(400).json({ message: "Invalid customizations format." });
          }
        } else {
          return res.status(400).json({ message: "Invalid customizations format." });
        }
      }
    } else if (typeof updatedItem.customizations === 'object') {
      console.log("Customizations is already an object.");
    }

    const item = await models.Product.findByIdAndUpdate(req.params.id, updatedItem, { new: true });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ message: 'Item updated successfully', item });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


const deleteProduct = async (req, res) => {
  const itemId = req.params.id;

  if (!itemId) {
    return res.status(400).json({ message: 'Item ID is required' });
  }

  try {
    const item = await models.Product.findByIdAndDelete(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ message: 'Item deleted successfully', item });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

module.exports = { getAllProducts, updateProduct, deleteProduct, addProduct, getProduct };