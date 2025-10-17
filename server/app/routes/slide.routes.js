const express = require('express');
const controller = require('../controllers/slide.controller'); // Ensure the path is correct
const multer = require('multer');
const path = require('path');

// Setup Multer for file storage
const storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './public/slides');
    },
    filename: function(req, file, callback) {
        // Filename configuration
        callback(null, `${req.params.slideNumber}${path.extname(file.originalname)}`);
    }
});


const upload = multer({ storage: storage });

module.exports = (app) => {
    const router = express.Router();

    // Return the most recent slide images stored on disk
    router.get('/', controller.listRecentSlides);

    // Route to get slide data
    router.get('/:slideNumber', controller.getSlide);

    // Route for updating an existing slide with image upload
    // Use Multer middleware to handle the file upload
    router.post('/:slideNumber', upload.single('image'), controller.updateSlide);

    // Use the router for the '/api/slide' base path
    app.use('/api/slide', router);

    // Route for creating a new slide (if necessary)
    app.post('/api/createslide', controller.createSlide);
};
