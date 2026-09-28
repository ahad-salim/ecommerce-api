import {
  loginUser,
  logoutUser,
  refreshUserToken,
  registerNewUser,
} from "../services/auth.service.js";
import { errorResponse, successResponse } from "../utils/responseFormatter.js";

const registerUser = async (req, res, next) => {
  try {
    const result = await registerNewUser(req.body);

    if (!result.success) {
      return errorResponse(res, result.message, result.error, 409);
      // res.status(409).json({
      //   success: false,
      //   message: result.message,
      // });
    }
    console.log(result);
    return successResponse(
      res,
      "Account Created Successfully",
      result.data,
      201,
    );
  } catch (err) {
    console.error("register error:", err);
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        result.error,
        result.statusCode,
      );
    }

    console.log(result);
    return successResponse(res, "Login Successful", result.data, 200);
  } catch (err) {
    console.error("login error:", err);
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await refreshUserToken(req.body.refreshToken);

    if (!result.success) {
      return errorResponse(
        res,
        result.message,
        result.error,
        result.statusCode,
      );
    }
     console.log(result);
    return successResponse(res, "Token refreshed successfully", result.data);
  } catch (err) {
    console.error("refresh token error:", err);
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const result = await logoutUser(req.body.refreshToken)

    if (!result.success) {
      return errorResponse (
        res,
        result.message,
        result.error,
        result.statusCode
      )
    }

    return successResponse (res, result.message)
  } catch (err) {
    console.error("logout error:", err);
    next(err);
  }
}

export { registerUser, login, refreshToken, logout };
