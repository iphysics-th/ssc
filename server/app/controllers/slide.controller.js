const fs = require('fs');
const path = require('path');
const db = require("../models");
const Slideshow = db.slideshow;

const SLIDES_DIR = path.join(__dirname, '../../public/slides');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

// Assuming slideImage will now be a path to the image stored on the server
exports.updateSlide = async (req, res) => {
    const { slideNumber } = req.params;
    const slideImagePath = req.file ? req.file.filename : null; // Use filename stored by multer
    const { slideHeader, slideDetail, slideLink } = req.body;

    try {
      // Build update object conditionally
      let updateObj = { slideHeader, slideDetail, slideLink };
      if (slideImagePath) {
        updateObj.slideImage = `${slideImagePath}`; // Store relative path from `public`
      }

      const updatedSlide = await Slideshow.findOneAndUpdate(
        { slideNumber },
        updateObj,
        { new: true }
      );

      if (!updatedSlide) {
        return res.status(404).send({ message: 'Slide not found' });
      }

      // Update response to include full URL for client
      updatedSlide.slideImage = req.protocol + '://' + req.get('host') + '/' + updatedSlide.slideImage;

      res.json(updatedSlide);
    } catch (error) {
      console.error(`Error updating slide ${slideNumber}:`, error);
      res.status(500).send({ message: 'Error updating slide' });
    }
};


exports.createSlide = async (req, res) => {
    const { slideNumber, slideImage, slideHeader, slideDetail, slideLink } = req.body;
  
    // Create a new slideshow document
    const slide = new Slideshow({
      slideNumber,
      slideImage,
      slideHeader,
      slideDetail,
      slideLink,
    });
  
    try {
      const savedSlide = await slide.save();
      res.status(201).send(savedSlide);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  };


// Function to get slide data
exports.getSlide = async (req, res) => {
    const { slideNumber } = req.params; // e.g., 'slide1', 'slide2', etc.

    try {
        const slide = await Slideshow.findOne({ slideNumber: slideNumber });
        if (!slide) {
            return res.status(404).send({ message: "Slide not found." });
        }
        res.status(200).send(slide);
    } catch (error) {
        res.status(500).send({ message: "Error retrieving slide information." });
    }
};

exports.listRecentSlides = async (req, res) => {
    try {
        if (!fs.existsSync(SLIDES_DIR)) {
            return res.json([]);
        }

        fs.readdir(SLIDES_DIR, (err, files) => {
            if (err) {
                console.error('Failed to read slides directory:', err);
                return res.status(500).send({ message: 'Error reading slides directory' });
            }

            const imageFiles = files
                .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
                .map((file) => ({
                    name: file,
                    time: fs.statSync(path.join(SLIDES_DIR, file)).mtime.getTime(),
                }))
                .sort((a, b) => b.time - a.time)
                .slice(0, 5)
                .map((file) => file.name);

            res.json(imageFiles);
        });
    } catch (error) {
        console.error('Unexpected error while listing slides:', error);
        res.status(500).send({ message: 'Failed to list slides' });
    }
};
