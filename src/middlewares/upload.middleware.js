import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import AppError from "../utils/AppError.js";

export const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
export const PRODUCT_IMAGE_DIR = path.join(UPLOAD_ROOT, "products");

fs.mkdirSync(PRODUCT_IMAGE_DIR, { recursive: true });

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

// mime type -> the only extension we will store it under
const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PRODUCT_IMAGE_DIR),
  // random server-side name: the client's file name is never used
  filename: (req, file, cb) =>
    cb(null, `${crypto.randomBytes(16).toString("hex")}${ALLOWED[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      return cb(
        new AppError("Only JPEG, PNG and WebP images are allowed", 400, "INVALID_FILE_TYPE"),
      );
    }
    cb(null, true);
  },
});

export const uploadProductImage = upload.single("image");

// The mime type is sent by the client and can be faked, so also check the real
// first bytes of the saved file (its "magic number").
const hasImageSignature = (buffer) => {
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png =
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const webp =
    buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return jpeg || png || webp;
};

export const verifyImageSignature = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("An image file is required (field name: image)", 400, "FILE_REQUIRED");
    }

    const handle = await fs.promises.open(req.file.path, "r");
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, 12, 0);
    await handle.close();

    if (!hasImageSignature(buffer)) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      throw new AppError("The file is not a valid image", 400, "INVALID_FILE_CONTENT");
    }

    next();
  } catch (err) {
    next(err);
  }
};
