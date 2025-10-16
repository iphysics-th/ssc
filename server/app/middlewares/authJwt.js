const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models/index.js");
const User = db.user;
const Role = db.role;


verifyToken = (req, res, next) => {
  // Bypass token validation for logout route
  if (req.path === '/api/auth/signout') {
    console.log("Bypassing token validation for logout.");
    return next();
  }

  let token = req.cookies['accessToken'];
  if (!token) {
    console.log("No token provided.");
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      console.log("JWT Verification Error:", err);
      // Proceed with logout even if token is invalid
      if (req.path === '/api/auth/signout') {
        console.log("Proceeding with logout despite invalid token.");
        return next();
      }
      return res.status(401).send({ message: "Unauthorized!" });
    }
    console.log("Token Verification Passed, User ID:", decoded.id);
    req.userId = decoded.id;
    req.roles = decoded.roles;
    next();
  });
};



isAdmin = (req, res, next) => {
  if (req.roles && req.roles.includes("admin")) {
    next();
    return;
  }
  res.status(403).send({ message: "Require Admin Role!" });
};

isMember = (req, res, next) => {
  if (req.roles && req.roles.includes("member")) {
    next();
    return;
  }
  res.status(403).send({ message: "Require Member Role!" });
};

const authJwt = { verifyToken, isAdmin, isMember };
module.exports = authJwt;
