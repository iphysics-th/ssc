const { authJwt } = require("../middlewares");
const controller = require("../controllers/user.controller");

module.exports = function(app) {

  app.get("/api/all", controller.allAccess);

  app.get("/api/user", [authJwt.verifyToken], controller.userBoard);

  app.get(
    "/api/user/member",
    [authJwt.verifyToken, authJwt.isMember],
    controller.memberBoard
  );

  app.get(
    "/api/user/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  app.get(
    "/api/auth/me",
    [authJwt.verifyToken],
    controller.getAuthenticatedUser
  );

  app.get(
    "/api/user/profile",
    [authJwt.verifyToken],
    controller.getProfile
  );

  app.put(
    "/api/user/profile",
    [authJwt.verifyToken],
    controller.updateReservationProfile
  );
};
