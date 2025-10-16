const { verifySignUp } = require("../middlewares");
const authJwt = require("../middlewares/authJwt");
const controller = require("../controllers/auth.controller");

module.exports = function(app) {
  
  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    controller.signup
  );

  app.post("/api/auth/signin", controller.signin);

  app.post("/api/auth/social-auth", controller.socialSignIn);

  app.post("/api/auth/signout", authJwt.verifyToken, controller.signout);

  app.get("/api/auth/verify", authJwt.verifyToken, controller.verifySession);

  // Ensure this matches the path you're requesting exactly
  app.get("/api/auth/refreshtoken", authJwt.verifyToken, controller.refreshToken);
};
