const config = require("../config/auth.config");
const db = require("../models");
require("dotenv").config();
const User = db.user;
const Role = db.role;
const { OAuth2Client } = require("google-auth-library");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

// ======================================================
// 🔹 Helper: Unified Cookie Setter
// ======================================================
function setAuthCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
  };

  // Explicit expiry times (default fallback)
  const accessTokenExpire =
    (Number(process.env.ACCESS_TOKEN_EXPIRE) || 300) * 1000; // 5 min
  const refreshTokenExpire =
    (Number(process.env.REFRESH_TOKEN_EXPIRE) || 604800) * 1000; // 7 days

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: accessTokenExpire,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: refreshTokenExpire,
  });
}

// ======================================================
// 🔹 Sign Up
// ======================================================
exports.signup = (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
  });

  user.save((err, user) => {
    if (err) {
      return res.status(500).send({ message: err });
    }

    if (req.body.roles) {
      Role.find({ name: { $in: req.body.roles } }, (err, roles) => {
        if (err) return res.status(500).send({ message: err });

        user.roles = roles.map((role) => role._id);
        user.save((err) => {
          if (err) return res.status(500).send({ message: err });
          res.send({ message: "User was registered successfully!" });
        });
      });
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) return res.status(500).send({ message: err });
        user.roles = [role._id];
        user.save((err) => {
          if (err) return res.status(500).send({ message: err });
          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

// ======================================================
// 🔹 Sign In
// ======================================================
exports.signin = (req, res) => {
  User.findOne({ email: req.body.email })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) return res.status(500).send({ message: err });
      if (!user) return res.status(404).send({ message: "User Not found." });

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid)
        return res
          .status(401)
          .send({ accessToken: null, message: "Invalid Password!" });

      const token = user.signAccessToken();
      const refreshToken = user.signRefreshToken();

      setAuthCookies(res, token, refreshToken);

      const authorities = user.roles.map((r) => r.name);

      console.log(
        `✅ Login successful for ${user.username} at ${new Date().toISOString()}`
      );

      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
      });
    });
};

// ======================================================
// 🔹 Sign Out
// ======================================================
exports.signout = (req, res) => {
  res.cookie("accessToken", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.cookie("refreshToken", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  console.log(`🚪 Logout at ${new Date().toISOString()}`);
  res.status(200).send({ message: "User has been logged out." });
};

// ======================================================
// 🔹 Verify Session
// ======================================================
exports.verifySession = (req, res) => {
  if (req.user) {
    const roles = req.user.roles.map((r) => r.name);
    const isAdmin = roles.includes("admin");
    const isMember = roles.includes("member");

    return res.status(200).json({
      isAuthenticated: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        roles,
      },
      isAdmin,
      isMember,
    });
  }
  return res.status(200).json({ isAuthenticated: false });
};

// ======================================================
// 🔹 Refresh Token
// ======================================================
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken)
    return res.status(401).send({ message: "Refresh token missing" });

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) {
        console.error("Invalid refresh token:", err.message);
        return res
          .status(401)
          .send({ message: "Invalid or expired refresh token" });
      }

      const userId = decoded.id;
      if (!userId)
        return res.status(401).send({ message: "Invalid token payload" });

      const user = await User.findById(userId).populate("roles", "name");
      if (!user) return res.status(404).send({ message: "User not found" });

      const roles = user.roles.map((r) => r.name);

      const newAccessToken = jwt.sign(
        { id: userId, username: user.username, roles },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "300s" }
      );

      const newRefreshToken = jwt.sign(
        { id: userId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "7d" }
      );

      setAuthCookies(res, newAccessToken, newRefreshToken);

      return res.status(200).send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          roles,
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        message: "Tokens refreshed successfully",
      });
    }
  );
};

// ======================================================
// 🔹 Social Sign In
// ======================================================
exports.socialSignIn = async (req, res) => {
  const { email, name, picture } = req.body;
  let baseUsername = email.substring(0, email.lastIndexOf("@"));
  let username = baseUsername;

  try {
    let user = await User.findOne({ email }).populate("roles", "-__v").exec();

    if (!user) {
      let userExists = await User.findOne({ username }).exec();
      let counter = 0;
      while (userExists) {
        counter++;
        username = `${baseUsername}${String(counter).padStart(2, "0")}`;
        userExists = await User.findOne({ username }).exec();
      }

      const memberRole = await Role.findOne({ name: "member" }).exec();
      if (!memberRole)
        return res.status(500).send({ message: "Member role not found." });

      user = new User({
        username,
        email,
        name,
        avatar: picture,
        roles: [memberRole._id],
      });

      await user.save();
      await user.populate("roles", "name");
    }

    const token = user.signAccessToken();
    const refreshToken = user.signRefreshToken();

    setAuthCookies(res, token, refreshToken);

    const authorities = user.roles.map((r) => r.name);
    console.log(
      `🌐 Social login success for ${user.username} at ${new Date().toISOString()}`
    );

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      roles: authorities,
      accessToken: token,
      refreshToken,
    });
  } catch (error) {
    console.error("❌ Social sign-in error:", error);
    res.status(401).send({ message: "Unable to process the request." });
  }
};
