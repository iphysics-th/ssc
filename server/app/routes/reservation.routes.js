const { authJwt } = require("../middlewares");
const controller = require("../controllers/reservation.controller");
const express = require('express');

module.exports = (app) => {
  const router = express.Router();

  router.post("/create", controller.createReservation);
  router.get("/check/:reservationNumber", controller.checkReservation);
  router.get("/details/:reservationNumber", controller.getReservationDetails);
  router.get("/my", authJwt.verifyToken, controller.getReservationsForCurrentUser);
  router.get("/by-email", authJwt.verifyToken, controller.getReservationsByEmail);
  router.put("/update-confirmation", controller.updateReservationConfirmation);
  router.get("/confirmed", controller.getConfirmedReservations);
  router.get("/reservation-table", controller.getAllReservations);
  router.get("/search", controller.getReservationByNumber);
  router.put('/update-status', controller.updateStatus);

  app.use("/api/reservation", router);
};
