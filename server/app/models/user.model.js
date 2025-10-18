const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { getNumberEnv } = require("../utils/env");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  name: String,
  password: String,
  avatar: String,
  roles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role"
    }
  ],
  reservationProfile: {
    prefix: String,
    name: String,
    surname: String,
    status: String,
    telephone: String,
    mail: String,
    school: String,
    schoolSize: String,
    updatedAt: Date,
  }
});

const ACCESS_TOKEN_EXPIRE_SECONDS = getNumberEnv("ACCESS_TOKEN_EXPIRE", 3600);
const REFRESH_TOKEN_EXPIRE_SECONDS = getNumberEnv("REFRESH_TOKEN_EXPIRE", 2592000);

// Sign access token
userSchema.methods.signAccessToken = function () {
  // Extract roles names from the user's roles
  const roles = this.roles.map(role => role.name);

  const accessTokenExpireTime = `${ACCESS_TOKEN_EXPIRE_SECONDS}s`; // Defaults handled in helper

  // Include user ID and roles in the JWT payload
  const payload = {
    id: this._id,
    roles: roles // Adding roles to the payload
  };

  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET || "default_secret_key", {
    expiresIn: accessTokenExpireTime,
  });
};

// Sign refresh token
userSchema.methods.signRefreshToken = function () {
  const refreshTokenExpireTime = `${REFRESH_TOKEN_EXPIRE_SECONDS}s`; // Defaults handled in helper
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret_key", {
    expiresIn: refreshTokenExpireTime,
  });
};

const User = mongoose.model("User", userSchema);
module.exports = User;
