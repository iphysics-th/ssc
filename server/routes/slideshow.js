// slideshow.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
    const slideshowDir = path.join(__dirname, '../../client/public/slideshow');

    fs.readdir(slideshowDir, (err, files) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error reading slideshow directory');
        }

        let imageFiles = files.filter(file => file.endsWith('.jpg')); // Filter for JPEG images

        imageFiles = imageFiles.map(file => ({
            name: file,
            time: fs.statSync(path.join(slideshowDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time) // Sort by modification time
        .slice(0, 5) // Get the five most recent files
        .map(file => file.name); // Return only file names

        res.json(imageFiles);
    });
});

module.exports = router;
