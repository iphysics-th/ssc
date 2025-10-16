const db = require("../models");
const Subject = db.subject; // Assuming your subject model is named 'subject' in db


exports.findAllLevels = async (req, res) => {
    try {
        const levels = await Subject.aggregate([
            {
                $group: {
                    _id: "$level_en",
                    level_th: { $first: "$level_th" }
                }
            },
            {
                $project: {
                    _id: 0,
                    level_en: "$_id",
                    level_th: 1
                }
            }
        ]);

        // Predefined order
        const order = ["elementary", "medium", "high", "general"];

        // Separate the levels into ordered and others
        const orderedLevels = [];
        const otherLevels = [];

        levels.forEach(level => {
            const index = order.indexOf(level.level_en);
            if (index !== -1) {
                orderedLevels[index] = level; // Place in the correct order position
            } else {
                otherLevels.push(level); // Collect additional levels
            }
        });

        // Concatenate the ordered levels with any additional levels
        const finalLevels = orderedLevels.concat(otherLevels.filter(l => l)); // Filter to remove any undefined entries from orderedLevels

        res.status(200).send(finalLevels);
    } catch (error) {
        res.status(500).send({ message: error.message || "Some error occurred while retrieving levels." });
    }
};


// 1. Show all "category_en" where "level_en" is "high"
exports.findLevel = async (req, res) => {
    const level = req.params.level;
    try {
        // Fetch categories with their English and Thai names
        const subjects = await Subject.find({ level_en: level }, 'category_en category_th');

        // Reduce the fetched subjects to a unique set of categories with both English and Thai names
        const categoriesMap = subjects.reduce((acc, subject) => {
            const { category_en, category_th } = subject;
            acc[category_en] = category_th; // Map English category to Thai
            return acc;
        }, {});

        // Predefined order of categories in English
        const order = ["Physics", "Chemistry", "Biology", "Mathematics", "Computer and Information Technology", "Applied Science and Innovation", "Environmental Science", "Home Economics", "Health Science"];

        // Sort and prepare the response according to the predefined order and include both English and Thai names
        const orderedCategories = order.reduce((acc, category) => {
            if (categoriesMap[category]) {
                acc.push({ category_en: category, category_th: categoriesMap[category] });
            }
            return acc;
        }, []);

        // Include any additional categories not predefined in the order
        Object.keys(categoriesMap).forEach((category) => {
            if (!order.includes(category)) {
                orderedCategories.push({ category_en: category, category_th: categoriesMap[category] });
            }
        });

        res.status(200).send(orderedCategories);
    } catch (error) {
        res.status(500).send({ message: error.message || "Some error occurred while retrieving subjects." });
    }
};


// 2. Show all "subcategory_en" within a chosen "category_en"
exports.findSubcategoriesByCategory = async (req, res) => {
    const { level, category } = req.params; // Capture the level and category from the URL parameters

    try {
        // Use aggregation to find distinct subcategory_en values for a given level_en and category_en
        const subcategories = await Subject.aggregate([
            {
                $match: {
                    level_en: level, // Match documents by level
                    category_en: category // And by category
                }
            },
            {
                $group: {
                    _id: "$subcategory_en", // Group by subcategory_en
                    subcategory_th: { $first: "$subcategory_th" } // Capture the corresponding Thai name
                }
            },
            {
                $project: {
                    _id: 0, // Exclude the _id field
                    subcategory_en: "$_id", // Rename _id to subcategory_en
                    subcategory_th: 1 // Include subcategory_th
                }
            },
            { $sort: { subcategory_en: 1 } } // Optionally, sort the results alphabetically by subcategory_en
        ]);

        res.status(200).send(subcategories);
    } catch (error) {
        res.status(500).send({ message: error.message || "Some error occurred while retrieving subcategories." });
    }
};


// 3. Show all "code" within a chosen "category_en"
exports.findCodesByCategory = async (req, res) => {
    const { level, category, subcategory } = req.params;

    try {
        const subjects = await Subject.find({
            level_en: level,
            category_en: category,
            subcategory_en: subcategory
        }, 'code name_th student_max') // Added student_max to the projection
        .sort('code');

        const responseData = subjects.map(subject => ({
            code: subject.code,
            name_th: subject.name_th,
            student_max: subject.student_max // Include student_max in the response
        }));

        res.status(200).send(responseData);
    } catch (error) {
        res.status(500).send({ message: error.message || "Some error occurred while retrieving subjects." });
    }
};


