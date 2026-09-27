import User from "../models/userModel.js";
import { errorResponse } from "../utils/responseFormatter.js";

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return errorResponse(res, "User not found", [], 404);
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { getCurrentUser }