import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import path from "path";
import { rateLimit } from "express-rate-limit";
const mongoSanitize = require("express-mongo-sanitize");
const cors = require('cors');

import AppError from "./utils/appError";
import globalErrorHandler from "./controllers/errorController";
import userRouter from "./routes/userRoutes";


export const app = express();
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.options('*', cors());

app.use(mongoSanitize());

app.use('/public', express.static(path.join(__dirname, 'public')));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

app.use((req: any, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

//ROUTES
app.use('/api/v1/users', userRouter);

// TODO: Add routing middleware here


app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
