import {
  changePassword,
  deactivateUser,
  getUserById,
  listUsers,
  updateMe,
  updateUserRole,
} from "../services/user.service.js";
import { successResponse } from "../utils/responseFormatter.js";

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    return successResponse(res, "User fetched successfully", user);
  } catch (error) {
    next(error);
  }
};

const updateMeController = async (req, res, next) => {
  try {
    const user = await updateMe(req.user.id, req.body);
    return successResponse(res, "Profile updated successfully", user);
  } catch (error) {
    next(error);
  }
};

const changePasswordController = async (req, res, next) => {
  try {
    await changePassword(req.user.id, req.body);
    return successResponse(res, "Password changed. Please log in again");
  } catch (error) {
    next(error);
  }
};

const listUsersController = async (req, res, next) => {
  try {
    const data = await listUsers(req.validateQuery);
    return successResponse(res, "Users retrieved successfully", data);
  } catch (error) {
    next(error);
  }
};

const updateUserRoleController = async (req, res, next) => {
  try {
    const user = await updateUserRole(req.user.id, req.params.id, req.body.role);
    return successResponse(res, "User role updated", user);
  } catch (error) {
    next(error);
  }
};

const deactivateUserController = async (req, res, next) => {
  try {
    const user = await deactivateUser(req.user.id, req.params.id);
    return successResponse(res, "User deactivated", user);
  } catch (error) {
    next(error);
  }
};

export {
  getCurrentUser,
  updateMeController,
  changePasswordController,
  listUsersController,
  updateUserRoleController,
  deactivateUserController,
};
