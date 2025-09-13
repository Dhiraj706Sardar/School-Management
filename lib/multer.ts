import multer from 'multer';

// File filter function
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images only using RegExp.exec()
  const imageRegex = /^image\/(jpe?g|png|webp)$/i;
  if (!imageRegex.exec(file.mimetype)) {
    return cb(new Error('Only image files (JPEG, PNG, WebP) are allowed!'));
  }
  cb(null, true);
};

// Configure multer with memory storage for file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});