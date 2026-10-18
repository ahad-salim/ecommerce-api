import {
  forgotPassword,
  loginUser,
  logoutUser,
  refreshUserToken,
  registerNewUser,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
} from "../services/auth.service.js";
import { clearCookieOptions, refreshCookieOptions } from "../utils/cookies.js";
import { successResponse } from "../utils/responseFormatter.js";

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerNewUser({ name, email, password });

    return successResponse(res, "Account Created Successfully", result, 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions());

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
    const result = await refreshUserToken(req.cookies?.refreshToken);

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions());

    return successResponse(res, "Token refreshed successfully", {
      accessToken: result.accessToken,
    });
  } catch (err) {
    if (err.statusCode === 401)
      res.clearCookie("refreshToken", clearCookieOptions());
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await logoutUser(req.cookies?.refreshToken);

    res.clearCookie("refreshToken", clearCookieOptions());

    return successResponse(res, "logout successfull");
  } catch (err) {
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

const verifyEmailController = async (req, res, next) => {
  try {
    await verifyEmail(req.params.token);

    return successResponse(res, "Email verified successfully");
  } catch (err) {
    next(err);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    await resendVerificationEmail(req.body.email);

    return successResponse(
      res,
      "If the account exists and is not verified, a new email has been sent",
    );
  } catch (err) {
    next(err);
  }
};

const forgotPasswordController = async (req, res, next) => {
  try {
    await forgotPassword(req.body.email);

    return successResponse(
      res,
      "If that email is registered, a reset link has been sent",
    );
  } catch (err) {
    next(err);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    await resetPassword(req.params.token, req.body.password);

    return successResponse(res, "Password reset successfully. Please log in");
  } catch (err) {
    next(err);
  }
};

export {
  registerUser,
  login,
  refreshToken,
  logout,
  registerAdmin,
  verifyEmailController,
  resendVerification,
  forgotPasswordController,
  resetPasswordController,
};
