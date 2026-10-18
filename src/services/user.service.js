import User from "../models/userModel.js";
import AppError from "../utils/AppError.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { revokeAllUserTokens } from "./auth.service.js";

const OBJECT_ID = /^[a-f\d]{24}$/i;

const assertObjectId = (id) => {
  if (typeof id !== "string" || !OBJECT_ID.test(id)) {
    throw new AppError("Invalid user ID", 400, "INVALID_ID");
  }
};

// The ONLY shape in which a user ever leaves the API:
// no password, no token fields, no lockout counters
const publishUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

async function getUserById(id) {
  const user = await User.findById(id);

  if (!user || !user.isActive) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return publishUser(user);
}

async function updateMe(userId, { name }) {
  const user = await User.findOneAndUpdate(
    { _id: userId, isActive: true },
    { name },
    { returnDocument: "after", runValidators: true },
  );

  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  return publishUser(user);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findOne({ _id: userId, isActive: true }).select("+password");

  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const match = await comparePassword(currentPassword, user.password);

  if (!match) {
    throw new AppError("Current password is incorrect", 401, "INVALID_CREDENTIALS");
  }

  await User.updateOne({ _id: user._id }, { password: await hashPassword(newPassword) });

  // Every device (including this one) must log in again
  await revokeAllUserTokens(user._id);
}

async function listUsers({ role, isActive, page, limit }) {
  const filter = {};
  if (role) filter.role = role;
  if (isActive) filter.isActive = isActive === "true";

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map(publishUser),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function updateUserRole(adminId, targetId, role) {
  assertObjectId(targetId);

  const target = await User.findById(targetId);

  if (!target) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  if (target.role === role) return publishUser(target);

  if (target.role === "admin" && role !== "admin") {
    // The caller is always an active admin, so blocking self-demotion also
    // guarantees there is always at least one admin left.
    if (String(target._id) === String(adminId)) {
      throw new AppError("You cannot remove your own admin role", 409, "CANNOT_DEMOTE_SELF");
    }
  }

  target.role = role;
  await target.save();

  // Old access tokens still say the old role for up to 15 minutes; refresh tokens
  // are revoked so the next refresh issues a token with the new role.
  await revokeAllUserTokens(target._id);

  return publishUser(target);
}

// "Delete" = deactivate. Orders and payments still point at this user.
async function deactivateUser(adminId, targetId) {
  assertObjectId(targetId);

  if (String(targetId) === String(adminId)) {
    throw new AppError("You cannot deactivate your own account", 409, "CANNOT_DEACTIVATE_SELF");
  }

  const user = await User.findOneAndUpdate(
    { _id: targetId, isActive: true },
    { isActive: false },
    { returnDocument: "after" },
  );

  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  await revokeAllUserTokens(user._id);

  return publishUser(user);
}

export {
  getUserById,
  updateMe,
  changePassword,
  listUsers,
  updateUserRole,
  deactivateUser,
};
