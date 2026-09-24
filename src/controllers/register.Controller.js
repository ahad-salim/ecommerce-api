import { registerNewUser } from "../services/authServices.js";
import { successResponse } from "../utils/responceFomater.js";

const registerUser = async (req, res, next) => {
  try {
    const result = await registerNewUser(req.body);

    if (!result.success) {
      return res.status(409).json("User already exits");
    }

    // res.status(201).json({
    //   success: true,
    //   message: "Account Created Successfully",
    // });

    return successResponse(res, "Account Created Successfully")

    console.log(result);

  } catch (err) {
    console.error("register error:", err);
    next(err);
  }
};


export { registerUser }