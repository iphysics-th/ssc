const express = require('express'); // Import express
const controller = require("../controllers/lecturer.controller");
const router = express.Router();

module.exports = function(app) {
    // Removed the incomplete middleware for clarity

    // Define public routes that don't require authentication
    app.get('/api/lecturer/specific', controller.findSpecific);
    app.get('/api/lecturer/divisions', controller.findDivisions);
    app.get('/api/lecturer/divisions/:division_en', controller.findByDivision);
    app.get('/api/lecturer/divisions/:division_en/:name_en', controller.findLecturerProfile); // Correct assumption
};
