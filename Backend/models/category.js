const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        categoryName: {
            type: String,
            required: [true, "Category Name is required"],
        },
        image: {
            type: String,
            required: [true, "Category image is required"],
        },
    },
    { timestamps: true }
);

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
module.exports = Category;