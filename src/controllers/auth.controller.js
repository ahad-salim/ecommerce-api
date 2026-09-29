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

    res.cookie("refreshToken", result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(result);
    return successResponse(
      res,
      "Login Successful",
      { accessToken: result.data.accessToken, user: result.data.user },
      200,
    );
  } catch (err) {
    console.error("login error:", err);
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await refreshUserToken(req.cookies.refreshToken);

    if (!result.success) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return errorResponse(
        res,
        result.message,
        result.error,
        result.statusCode,
      );
    }

    res.cookie("refreshToken", result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(result);
    return successResponse(res, "Token refreshed successfully", {
      accessToken: result.data.accessToken,
    });
  } catch (err) {
    console.error("refresh token error:", err);
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const result = await logoutUser(req.cookies.refreshToken);

    if (!result.success) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return errorResponse(
        res,
        result.message,
        result.error,
        result.statusCode,
      );
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return successResponse(res, result.message);
  } catch (err) {
    console.error("logout error:", err);
    next(err);
  }
};

export { registerUser, login, refreshToken, logout };
