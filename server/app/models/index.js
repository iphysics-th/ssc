const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;
mongoose.Promise = global.Promise;

db.user = require("./user.model");
db.role = require("./role.model");
db.lecturer = require("./lecturer.model")(mongoose);
db.reservation = require("./reservation.model")(mongoose);
db.slideshow = require("./slide.model");
db.subject = require("./subject.model")(mongoose);

db.ROLES = ["admin", "member", "student", "staff","moderator"];

module.exports = db;
