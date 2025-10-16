const db = require("../models");

const User = db.user;

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.memberBoard = (req, res) => {
  res.status(200).send("Member Content.");
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('roles', 'name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roles = Array.isArray(user.roles) ? user.roles.map((role) => role.name || role) : [];

    res.json({
      account: {
        id: user._id,
        username: user.username,
        name: user.name || '',
        email: user.email,
        avatar: user.avatar || null,
        roles,
      },
      reservationProfile: user.reservationProfile || null,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

exports.updateReservationProfile = async (req, res) => {
  try {
    const profileFields = ['prefix', 'name', 'surname', 'status', 'telephone', 'mail', 'school', 'schoolSize'];
    const profileData = {};

    profileFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profileData[field] = req.body[field];
      }
    });

    profileData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      req.userId,
      { reservationProfile: profileData },
      { new: true, runValidators: true }
    ).populate('roles', 'name');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roles = Array.isArray(user.roles) ? user.roles.map((role) => role.name || role) : [];

    res.json({
      message: 'บันทึกข้อมูลเรียบร้อย',
      account: {
        id: user._id,
        username: user.username,
        name: user.name || '',
        email: user.email,
        avatar: user.avatar || null,
        roles,
      },
      reservationProfile: user.reservationProfile || null,
    });
  } catch (error) {
    console.error('Error updating reservation profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};
