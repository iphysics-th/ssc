const express = require('express'); // Add this line to import express
const { authJwt } = require("../middlewares");
const controller = require("../controllers/lecturer.controller");


module.exports = function(app) {
    app.use(function(req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
    });

  // Create a new Lecturer
  app.post("/api/lecturer", [authJwt.verifyToken, authJwt.isAdmin], controller.create); // Assuming you want to protect this route

  // Retrieve all Lecturer
  app.get("/api/lecturer", controller.findAll);

  // Retrieve a single Lecturer with id
  app.get("/api/lecturer/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.findOne);

  // Update a Lecturer with id
  app.put("/api/lecturer/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.update); // Assuming you want to protect this route

  // Delete a Lecturer with id
  app.delete("/api/lecturer/:id", [authJwt.verifyToken, authJwt.isMember], controller.delete);

  // Delete all Lecturer
  app.delete("/api/lecturer", [authJwt.verifyToken, authJwt.isAdmin], controller.deleteAll); // Assuming you want to protect this route as well


};
