import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import validator from "validator";

interface IUser extends Document {
  find: any;
  name: string;
  userName: string;
  email: string;
  photo: string;
  role: string;
  password: string;
  passwordConfirm?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  active?: boolean;

  correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
}

const userSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
    unique: true,
  },
  userName: {
    type: String,
    required: [true, "Please tell us your username!"],
    // unique: true,
  },
  email: {
    type: String,
    required: [true, "Please provide your email address"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide your password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (this: IUser, el: String) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});


userSchema.pre<IUser>('save', async function(next) {
    // Ensure userName is set before saving
    if (!this.userName) {
      const err = new Error('Username is required.');
      (err as any).statusCode = 400;
      return next(err);
    }

  const existingUserWithEmail = await this.model('User').findOne({ email: this.email });
  const existingUserWithName = await this.model('User').findOne({ name: this.name });
  const existingUserWithUserName = await this.model('User').findOne({ userName: this.userName });

  if (existingUserWithEmail) {
    const err = new Error('Email address is already in use.');
    (err as any).statusCode = 400;
    return next(err);
  }

  if (existingUserWithName) {
    const err = new Error('Name is already in use.');
    (err as any).statusCode = 400;
    return next(err);
  }

  if (existingUserWithUserName) {
    const err = new Error('Username is already in use.');
    (err as any).statusCode = 400;
    return next(err);
  }

  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.pre<IUser>(/^find/, function(next) {
  // this points to the current query (query middleware)
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(candidatePassword: string, userPassword: string) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt((this.passwordChangedAt.getTime() / 1000).toString(), 10);

    return JWTTimestamp < changedTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};


const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export { IUser, User };
