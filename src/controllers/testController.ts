// controllers/testController.ts
import { Request, Response, NextFunction } from 'express';
import { Test } from './../model/test';
import catchAsync from './../utils/catchAsync';
import AppError from './../utils/appError';
import { restrictToSubscribedUsers } from './authController';

export const getTest = [
  restrictToSubscribedUsers,
  catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user._id;
    const newTest = await Test.createTestWithRandomQuestions(userId);

    res.status(200).json({
      status: 'success',
      data: {
        data: newTest,
      },
    });
  }),
];

export const getAllTests = [
  restrictToSubscribedUsers,
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tests = await Test.find().populate('questions');

    if (tests.length === 0) {
      return next(new AppError('No tests found', 404));
    }

    res.status(200).json({
      status: 'success',
      results: tests.length,
      data: {
        data: tests,
      },
    });
  }),
];
