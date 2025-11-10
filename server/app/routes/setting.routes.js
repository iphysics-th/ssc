const { authJwt } = require("../middlewares");
const controller = require("../controllers/setting.controller");

module.exports = function (app) {
  app.get("/api/config/discount", controller.getDiscountSetting);
  app.put(
    "/api/admin/config/discount",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.updateDiscountSetting
  );
};
