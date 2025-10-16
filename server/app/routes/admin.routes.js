const controller = require("../controllers/admin.controller");
const authJwt = require("../middlewares/authJwt");

module.exports = function (app) {
  app.put("/api/admin/assign-role", [authJwt.verifyToken, authJwt.isAdmin], controller.assignRoleByEmail);
  app.get("/api/admin/users", [authJwt.verifyToken, authJwt.isAdmin], controller.listUsers);
  app.put("/api/admin/users/:id/role", [authJwt.verifyToken, authJwt.isAdmin], controller.updateUserRole);
  app.delete("/api/admin/users/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.deleteUser);
};
