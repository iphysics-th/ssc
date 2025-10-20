const { authJwt } = require("../middlewares");
const controller = require("../controllers/reservationRule.controller");

module.exports = function (app) {
  app.get("/api/reservation/unavailable", controller.publicRules);

  app.get(
    "/api/admin/reservation-rules",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.listAdminRules
  );

  app.post(
    "/api/admin/reservation-rules",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.createRule
  );

  app.delete(
    "/api/admin/reservation-rules/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.deleteRule
  );
};
