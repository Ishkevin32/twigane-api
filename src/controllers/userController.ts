import { Request, RequestHandler } from "express";
import multer from "multer";
const sharp = require('sharp');
import { User, IUser } from "./../model/user";
import catchAsync from "./../utils/catchAsync";
import AppError from "./../utils/appError";
import * as factory from "./handlerFactory";

interface AuthRequest extends Request {
    user?: IUser; // Define the 'user' property with the IUser type
  }

const multerStorage = multer.memoryStorage();

const multerFilter = (_req: Request, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const updloadUserPhoto = upload.single("photo");

export const resizeUserPhoto: RequestHandler = catchAsync(
  async (req: AuthRequest, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${(req.user as IUser).id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

    next();
  }
);

const filterObj = (obj: any, ...allowedFields: string[]) => {
  const newObj: any = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const getMe: RequestHandler = (req: AuthRequest, res, next) => {
  req.params.id = (req.user as IUser).id;
  next();
};

export const updateMe: RequestHandler = catchAsync(async (req: AuthRequest, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword instead.",
        400
      )
    );
  }

  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(
    (req.user as IUser).id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

export const deleteMe: RequestHandler = catchAsync(async (req: AuthRequest, res, next) => {
  await User.findByIdAndUpdate((req.user as IUser).id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const createUser: RequestHandler = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!, Please use /signup instead",
  });
};

export const searchUsers: RequestHandler = catchAsync(async (req, res, next) => {
  const { userName } = req.query;
  if (!userName) {
    return next(new AppError('Please provide a username to search for', 400));
  }

  // Perform case-insensitive search by userName
  const users = await User.find({ userName: { $regex: new RegExp(String(userName), 'i') } });

  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});


export const getUser: RequestHandler = factory.getOne(User);
export const getAllUsers: RequestHandler = factory.getAll(User);

// Do NOT update passwords with this
export const updateUser: RequestHandler = factory.updateOne(User);
export const deleteUser: RequestHandler = factory.deleteOne(User);
