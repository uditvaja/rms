const models = require("../models");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

const createCategory = async (req, res) => {
    try {
        const { categoryName } = req.body;
        const image = req.file ? req.file.path : null;

        if (!categoryName || !image) {
            return res.status(400).json({ error: 'Category name and image are required' });
        }

        let imageUrl = req.body.image;

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "Category_image",
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

        const category = new models.Category({ categoryName, image: imageUrl });
        await category.save();

        res.status(201).json({ message: 'Category added successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getCategory = async (req, res) => {
    try {
        const categories = await models.Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error fetching categories" });
    }
};

module.exports = { createCategory, getCategory }