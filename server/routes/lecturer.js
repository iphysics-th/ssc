const express = require('express');
const router = express.Router();
const Lecturer = require('../models/lecturer'); // Update the path to where your Lecturer model is located

router.get('/specific', async (req, res) => {
    try {
        // Extract name_en query parameter
        const name_en = req.query.name_en;

        // If name_en is provided, find the lecturer by name_en using a case-insensitive query
        // Otherwise, return all lecturers
        const query = name_en ? { name_en: new RegExp(name_en, 'i') } : {};

        console.log("MongoDB Query:", query); // Debugging statement

        const lecturers = await Lecturer.find(query);
        res.json(lecturers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/divisions', async (req, res) => {
    try {
        const divisions = await Lecturer.aggregate([
            {
                $group: {
                    _id: "$division_en",
                    division_th: { $first: "$division_th" },
                    lecturerCount: { $sum: 1 } // Count the number of lecturers in each division
                }
            },
            {
                $project: {
                    _id: 0,
                    division_en: "$_id",
                    division_th: 1,
                    lecturerCount: 1
                }
            }
        ]);
        res.json(divisions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/divisions/:division_en', async (req, res) => {
    try {
        const divisionEn = req.params.division_en;
        const divisionData = await Lecturer.find({ division_en: divisionEn })
            .select('name_th surname_th name_en division_th bachelor_year position_en doctoral');
        res.json(divisionData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/divisions/:division_en/:name_en', async (req, res) => {
    try {
        const { division_en, name_en } = req.params;
        const lecturerProfile = await Lecturer.findOne({ division_en: division_en, name_en: name_en })
            .select('name_th surname_th position_en name_en surname_en division_en division_th program image doctoral doctoral_year master master_year bachelor bachelor_year specialty industrial paper grant patent email');
        if (!lecturerProfile) {
            return res.status(404).send('Lecturer not found');
        }
        res.json(lecturerProfile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Modified endpoint to get lecturers, optionally filtered by division
router.get('/', async (req, res) => {
    const divisionQuery = req.query.division;
    try {
        const query = divisionQuery ? { division_en: divisionQuery } : {};
        const lecturers = await Lecturer.find(query);
        res.json(lecturers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;