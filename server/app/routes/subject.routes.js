const subjectsController = require('../controllers/subject.controller');

module.exports = function (app) {

    app.get("/api/subject", subjectsController.findAllLevels);

    app.get("/api/subject/:level", subjectsController.findLevel);

    app.get("/api/subject/:level/:category", subjectsController.findSubcategoriesByCategory);

    app.get("/api/subject/:level/:category/:subcategory", subjectsController.findCodesByCategory);

    // Include any additional or existing routes here
};
