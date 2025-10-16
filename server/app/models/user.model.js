const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

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

// Helper to parse expiration time in seconds to a format that jwt.sign expects
function parseExpirationTime(expTime) {
  // JWT expects a numeric value in seconds or a string describing a time span zeit/ms.
  // Since your .env values are in seconds, we directly use them.
  return `${expTime}s`; // Append 's' to indicate seconds to be compatible with zeit/ms format used by jwt.sign
}

// Sign access token
userSchema.methods.signAccessToken = function () {
  // Extract roles names from the user's roles
  const roles = this.roles.map(role => role.name);

  const accessTokenExpireTime = parseExpirationTime(process.env.ACCESS_TOKEN_EXPIRE || "3600"); // Defaults to 3600 seconds if not specified

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
  const refreshTokenExpireTime = parseExpirationTime(process.env.REFRESH_TOKEN_EXPIRE || "2592000"); // Defaults to 2592000 seconds if not specified
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret_key", {
    expiresIn: refreshTokenExpireTime,
  });
};

const User = mongoose.model("User", userSchema);
module.exports = User;
