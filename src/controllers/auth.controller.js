import {
  loginUser,
  logoutUser,
  refreshUserToken,
  registerNewUser,
} from "../services/auth.service.js";
import { successResponse } from "../utils/responseFormatter.js";

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } =req.body;
    const result = await registerNewUser({name, email, password});

    return successResponse(res, "Account Created Successfully", result, 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);


    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(
      res,
      "Login Successful",
      { accessToken: result.accessToken, user: result.user },
      200,
    );
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await refreshUserToken(req.cookies.refreshToken);

    // if (!result.success) {
    //   res.clearCookie("refreshToken", {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === "production",
    //     sameSite: "strict",
    //   });
    //   return errorResponse(
    //     res,
    //     result.message,
    //     result.error,
    //     result.statusCode,
    //   );
    // }

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, "Token refreshed successfully", {
      accessToken: result.accessToken,
    });
  } catch (err) {
    if (err.isOperational)
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await logoutUser(req.cookies.refreshToken);

    // if (!result.success) {
    //   res.clearCookie("refreshToken", {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === "production",
    //     sameSite: "strict",
    //   });
    //   return errorResponse(
    //     res,
    //     result.message,
    //     result.error,
    //     result.statusCode,
    //   );
    // }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return successResponse(res, "logout successfull");
  } catch (err) {
    if (err.isOperational)
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    next(err);
  }
};

const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerNewUser({
      name,
      email,
      password,
      role: "admin",
      isVerified: true,
    });

    return successResponse(
      res,
      "Admin Account Created Successfully",
      result,
      201,
    );
  } catch (err) {
    next(err);
  }
};

export { registerUser, login, refreshToken, logout, registerAdmin };
