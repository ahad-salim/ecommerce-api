import { registerNewUser } from "../services/auth.service.js";
import { successResponse } from "../utils/responseFormatter.js";

const registerUser = async (req, res, next) => {
  try {
    const result = await registerNewUser(req.body);

    if (!result.success) {
      return res.status(409).json({
        success: false,
        message: result.message,
      });
    }
    console.log(result);
    return successResponse(res, "Account Created Successfully", result);
  } catch (err) {
    console.error("register error:", err);
    next(err);
  }
};

export { registerUser };
