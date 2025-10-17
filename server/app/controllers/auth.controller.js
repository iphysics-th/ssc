const config = require("../config/auth.config");
const db = require("../models");
require("dotenv").config();
const User = db.user;
const Role = db.role;
const { OAuth2Client } = require('google-auth-library');
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");


exports.signup = (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8)
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

exports.signin = (req, res) => {
  User.findOne({ email: req.body.email })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

      if (!passwordIsValid) {
        return res.status(401).send({ accessToken: null, message: "Invalid Password!" });
      }

      const token = user.signAccessToken(); // Ensure this method exists in your User model
      const refreshToken = user.signRefreshToken(); // Ensure this method exists in your User model

      // Convert environment variable values to numbers for cookie maxAge
      const accessTokenExpire = Number(process.env.ACCESS_TOKEN_EXPIRE) * 1000; // Convert seconds to milliseconds
      const refreshTokenExpire = Number(process.env.REFRESH_TOKEN_EXPIRE) * 1000; // Convert seconds to milliseconds

      // Log the login event
      console.log(`Login successful for user: ${user.username} at ${new Date().toISOString()}`);

      // Set cookies for tokens
      res.cookie('accessToken', token, { httpOnly: true, maxAge: accessTokenExpire }); // Use environment variable
      res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: refreshTokenExpire }); // Use environment variable

      var authorities = [];
      for (let i = 0; i < user.roles.length; i++) {
        authorities.push(user.roles[i].name);
      }

      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
      });
    });
};


exports.signout = (req, res) => {
  // Clear the tokens
  res.cookie('accessToken', '', { maxAge: 0, path: '/', httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Strict" });
  res.cookie('refreshToken', '', { maxAge: 0, path: '/', httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Strict" });

  // Log the logout event
  console.log(`Logout action at ${new Date().toISOString()}`);

  res.status(200).send({ message: "User has been logged out." });
};




exports.verifySession = (req, res) => {
  if (req.user) {
    const roles = req.user.roles.map(role => role.name);
    const isAdmin = roles.includes("admin");
    const isMember = roles.includes("member");

    res.status(200).json({
      isAuthenticated: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        roles: roles
      },
      isAdmin,
      isMember
    });
  } else {
    res.status(200).json({ isAuthenticated: false });
  }
};


exports.refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).send({ message: "Refresh token missing" });
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Invalid refresh token" });
    }

    const userId = decoded.id;

    if (!userId) {
      return res.status(401).send({ message: "Invalid refresh token payload" });
    }

    // Generate a new access token
    const newAccessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE // Ensure this is in seconds
    });

    // Convert ACCESS_TOKEN_EXPIRE from seconds to milliseconds for maxAge
    const accessTokenExpireTime = process.env.ACCESS_TOKEN_EXPIRE ? parseInt(process.env.ACCESS_TOKEN_EXPIRE, 10) * 1000 : 300000; // Default 5 minutes if not set

    // Add secure and SameSite attributes if your site is served over HTTPS
    const cookieOptions = {
      httpOnly: true,
      maxAge: accessTokenExpireTime,
      secure: process.env.NODE_ENV === "production", // Ensure cookies are sent securely in production
      sameSite: "Strict" // Helps mitigate CSRF attacks
    };

    res.cookie('accessToken', newAccessToken, cookieOptions);

    // Optionally, issue a new refresh token if your logic requires it

    res.status(200).send({
      accessToken: newAccessToken,
      message: "Access token updated successfully."
    });
  });
};


// Assuming the rest of the file is as provided
exports.socialSignIn = async (req, res) => {
  const { email, name, picture } = req.body;

  // Extract username from email
  let baseUsername = email.substring(0, email.lastIndexOf("@"));
  let username = baseUsername;

  try {
    let user = await User.findOne({ email })
      .populate("roles", "-__v")
      .exec();

    if (!user) {
      // Check if the username already exists
      let userExists = await User.findOne({ username }).exec();
      let counter = 0; // Initialize counter for appending numbers

      // If username exists, loop to find a unique username by appending numbers
      while (userExists) {
        counter++;
        username = `${baseUsername}${String(counter).padStart(2, '0')}`; // Append numbers with leading zeros
        userExists = await User.findOne({ username }).exec(); // Check again with the new username
      }

      // Proceed with creating a new user with the unique username
      const memberRole = await Role.findOne({ name: "member" }).exec();
      if (!memberRole) {
        return res.status(500).send({ message: "Member role not found." });
      }

      user = new User({
        username, // Unique username
        email,
        name, // Store the full name from Google
        avatar: picture,
        roles: [memberRole._id],
      });

      await user.save();

      // Re-fetch or re-populate roles to ensure role names are included after the save
      await user.populate("roles", "name").execPopulate();
    }

    // The rest of your code for generating tokens, setting cookies, and sending the response
    const token = user.signAccessToken();
    const refreshToken = user.signRefreshToken();
    // Convert environment variable values to numbers for cookie maxAge
    const accessTokenExpire = Number(process.env.ACCESS_TOKEN_EXPIRE) * 1000; // Convert seconds to milliseconds
    const refreshTokenExpire = Number(process.env.REFRESH_TOKEN_EXPIRE) * 1000; // Convert seconds to milliseconds

    // Set cookies for tokens
    res.cookie('accessToken', token, { httpOnly: true, maxAge: accessTokenExpire });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: refreshTokenExpire });

    let authorities = [];
    for (let i = 0; i < user.roles.length; i++) {
      authorities.push(user.roles[i].name);
    }

    // Log the login event
    console.log(`Social login successful for user: ${user.username} at ${new Date().toISOString()}`);

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      roles: authorities,
      accessToken: token,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error("Error processing the social sign-in request:", error);
    return res.status(401).send({ message: "Unable to process the request." });
  }
};

