import User from "../models/userModel.js";
import { getUserById } from "../services/user.service.js";
import { errorResponse, successResponse } from "../utils/responseFormatter.js";

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id)
    return successResponse(res, "User fetch successfully", user, 200)
  } catch (error) {
    console.error("Get user error:", error);
    next(error);
  }
};

export { getCurrentUser }