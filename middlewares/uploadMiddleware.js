const multer = require("multer");
const path = require("path");
const stream = require("stream");
const cloudinary = require("cloudinary").v2;

// Configure cloudinary via env CLOUDINARY_URL
cloudinary.config({ secure: true });

// Configure disk storage (adjust destination as needed)
// Use memory storage; we'll stream buffers to Cloudinary
const storage = multer.memoryStorage();

// Basic filter: accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({ storage, fileFilter });

// Fields: single cover image + multiple images
const uploadProductImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

// Helper: upload a buffer to Cloudinary and return the secure_url
const uploadBufferToCloudinary = (buffer, folder, publicIdBase) =>
  new Promise((resolve, reject) => {
    const passThrough = new stream.PassThrough();
    passThrough.end(buffer);
    const timestamp = Date.now();
    const publicId = `${publicIdBase}-${timestamp}`;
    cloudinary.uploader
      .upload_stream(
        { folder, public_id: publicId, resource_type: "image" },
        (err, result) => {
          if (err) return reject(err);
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });

// Upload to Cloudinary then map URLs into req.body
const mapProductImagesToBody = async (req, res, next) => {
  try {
    const folder = "products";
    if (req.files) {
      if (req.files.imageCover && req.files.imageCover[0]) {
        const coverFile = req.files.imageCover[0];
        const coverUrl = await uploadBufferToCloudinary(
          coverFile.buffer,
          folder,
          path.parse(coverFile.originalname).name.replace(/\s+/g, "-")
        );
        req.body.imageCover = coverUrl;
      }
      if (req.files.images && Array.isArray(req.files.images)) {
        const urls = [];
        for (const img of req.files.images) {
          const url = await uploadBufferToCloudinary(
            img.buffer,
            folder,
            path.parse(img.originalname).name.replace(/\s+/g, "-")
          );
          urls.push(url);
        }
        req.body.images = urls;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadProductImages,
  mapProductImagesToBody,
};


