import User from "../models/userModel.js";
import AppError from "../utils/AppError.js";


async function getUserById(id) {
    const user = await User.findById(id)

    if (!user) {
        throw new AppError("User not foud", 404, "USER_NOT_FOUND")
    }

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerify: user.isVerified
    }
}

export { getUserById }