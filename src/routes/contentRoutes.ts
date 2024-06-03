import express, { Router } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import * as contentController from "./../controllers/contentController";
import * as authController from "./../controllers/authController";
import { upload } from "../utils/multerConfig";
import { s3, bucketName, randomImageName } from "../utils/s3bucket";

const router = Router();

router.use(authController.protect);

router.route("/").get(contentController.getAllContents);

router.use(authController.restrictTo("admin", "creator"));

router.use(express.json());

router.post("/uploads", upload.single("file"), async (req, res, next) => {
  console.log("req.body", req.body);
  console.log("req.file", req.file);

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const fileStream = new Readable();
  fileStream.push(req.file.buffer);
  fileStream.push(null);

  const randomName = randomImageName();
  const params = {
    Bucket: bucketName,
    Key: randomName,
    Body: req.file?.buffer,
    ContentType: req.file?.mimetype,
  };

  const command = new PutObjectCommand(params);

  try {
    await s3.send(command);
    const fileName = params.Key;
    const { title, description, type, creator } = req.body;

    // Call the createContent function with appropriate arguments
    contentController.createContentWithFile(
      title,
      description,
      type,
      creator,
      fileName,
      res
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({ message: "Error uploading file" });
  }
});

router
  .route("/:id")
  .get(contentController.getContent)
  .patch(contentController.updateContent)
  .delete(contentController.deleteContent);

export = router;
