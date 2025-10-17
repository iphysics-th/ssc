const express = require('express');
const { authJwt } = require("../middlewares");
const controller = require("../controllers/lecturer.controller");

module.exports = (app) => {
  const router = express.Router();

  router.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Public endpoints
  router.get('/', controller.findAll);
  router.get('/specific', controller.findSpecific);
  router.get('/divisions', controller.findDivisions);
  router.get('/divisions/:division_en', controller.findByDivision);
  router.get('/divisions/:division_en/:name_en', controller.findLecturerProfile);

  // Admin endpoints
  router.post('/', [authJwt.verifyToken, authJwt.isAdmin], controller.create);
  router.get('/:id', [authJwt.verifyToken, authJwt.isAdmin], controller.findOne);
  router.put('/:id', [authJwt.verifyToken, authJwt.isAdmin], controller.update);
  router.delete('/:id', [authJwt.verifyToken, authJwt.isAdmin], controller.delete);
  router.delete('/', [authJwt.verifyToken, authJwt.isAdmin], controller.deleteAll);

  app.use('/api/lecturer', router);
};
