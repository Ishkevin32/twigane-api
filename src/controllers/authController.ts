import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
const jwt = require("jsonwebtoken");
import { promisify } from "util";
import { User, IUser } from "./../model/user";
import { Subscription } from './../model/subscription';
import catchAsync from "./../utils/catchAsync";
import AppError from "./../utils/appError";
import Email from "./../utils/email";

const signToken = (id: any) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN!,
  });
};

const createSendToken = (
  user: IUser,
  statusCode: number,
  req: Request,
  res: Response
) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRES_IN!) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

  // Remove the password from output
  user.password = "undefined";

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let { name, userName, email, password, passwordConfirm, passwordChangedAt, role } = req.body;

    // If username is not provided, set it to name
    if (!userName) {
      return next(new AppError("Username is required!", 400));
    }

    // Ensure userName is unique
    const existingUserName = await User.findOne({ userName });
    if (existingUserName) {
      return next(new AppError("Username is already taken!", 400));
    }

    const newUser = await User.create({
      name,
      userName,
      email,
      password,
      passwordConfirm,
      passwordChangedAt,
      role,
    });

    createSendToken(newUser, 201, req, res);
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userName, password } = req.body;

    // 1) Check if email and password exist
    if (!userName) {
      return next(new AppError("Please provide username!", 400));
    }
    else if (!password) {
      return next(new AppError("Please provide password!", 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ userName }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("Incorrect username", 401));
    }

    if (!(await user.correctPassword(password, user.password))) {
      return next(new AppError("Incorrect password", 401));
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, req, res);
  }
);

export const logout = (req: Request, res: Response) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

export const protect = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    // 1) Getting token and check if it's there
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    // 2) Verifictaion token
    const decoded: any = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET!
    );

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError("The token does no longer exist", 401));
    }
    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError("User recently changed password Please log in again", 401)
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  }
);

// Only for rendered pages, no errors!
export const isLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded: any = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET!
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 4) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

export const restrictTo = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    // roles is an array ['admin', 'creator'].
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

export const restrictToSubscribedUsers = catchAsync(async (req: any, res: Response, next: NextFunction) => {
  const userId = req.user._id;
  const currentDate = new Date();

  const subscription = await Subscription.findOne({
    user: userId,
    endDate: { $gte: currentDate },
  });

  if (!subscription) {
    return next(new AppError('You do not have an active subscription to access this resource', 403));
  }

  next();
});


export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(
        new AppError("There is no user with that email address.", 404)
      );
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email

    try {
      const resetURL = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/resetPassword/${resetToken}`;
      await new Email(user, resetURL).sendPasswordReset();

      res.status(200).json({
        status: "success",
        message: "Token sent to email!",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      console.log(err);
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          "There is an error sending the email, Try again later!",
          500
        )
      );
    }
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT

    createSendToken(user, 200, req, res);
  }
);

export const updatePassword = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    // 1) Get user from collection
    const user: any = await User.findById(req.user.id).select("password");
    // 2) Check if posted password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError("Your current password is wrong", 401));
    }
    // 3) If so, update Password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, req, res);
  }
);
