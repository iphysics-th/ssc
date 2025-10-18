require("dotenv").config();

module.exports = {
  secret: process.env.ACCESS_TOKEN_SECRET || "default_secret_key",
  jwtExpiration: process.env.JWT_EXPIRATION || 86400, // 24h default
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || 604800, // 7d default
};
