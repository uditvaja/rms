const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Upload folder
    },
    filename: (req, file, cb) => {
        
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

// File filter for image validation
const fileFilter = (req, file, cb) => {
    console.log("fkrslsk",file);
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed.'),false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter,
});

module.exports = upload;