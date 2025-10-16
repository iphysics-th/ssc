const db = require("../models");

const User = db.user;
const Role = db.role;

const formatUser = (user) => {
  const roles = Array.isArray(user.roles)
    ? user.roles.map((role) =>
        typeof role === 'string' ? role : role?.name
      ).filter(Boolean)
    : [];

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    roles,
  };
};

exports.assignRoleByEmail = (req, res) => {
  const { email, roles } = req.body;

  User.findOne({ email: email }, (err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!user) {
      res.status(404).send({ message: "User not found." });
      return;
    }

    Role.find({ name: { $in: roles } }, (err, foundRoles) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      user.roles = foundRoles.map(role => role._id);

      user.save(err => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        res.send({ message: "User roles updated successfully!" });
      });
    });
  });
};

exports.listUsers = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const users = await User.find({
      _id: { $ne: currentUserId }
    }).populate('roles', 'name');

    res.json(users.map(formatUser));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      return res.status(400).json({ message: 'Role not found' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { roles: [roleDoc._id] },
      { new: true }
    ).populate('roles', 'name');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Role updated successfully', user: formatUser(user) });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Failed to update role' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.userId;

    if (id === currentUserId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};
