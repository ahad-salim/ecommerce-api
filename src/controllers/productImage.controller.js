import { setProductImage } from "../services/productImage.service.js";
import { successResponse } from "../utils/responseFormatter.js";

export const uploadProductImageController = async (req, res, next) => {
  try {
    const result = await setProductImage(req.params.id, req.file);

    return successResponse(res, "Product image uploaded", result.data);
  } catch (error) {
    next(error);
  }
};
