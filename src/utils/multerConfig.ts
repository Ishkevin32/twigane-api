import multer from "multer";

// Define storage for uploaded files
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/uploads"); // Save files to the 'public/uploads' directory
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}-${file.originalname}`); // Generate unique file name
//   },
// });

const storage = multer.memoryStorage();

// Configure Multer to accept different types of content
const upload = multer({storage: storage});

export { upload };
