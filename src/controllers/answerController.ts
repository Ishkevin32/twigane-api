import { Request, RequestHandler } from "express";
import { Answer, IAnswer } from "./../model/answer";
import * as factory from "./handlerFactory";

export const createAnswer = factory.createOne(Answer);
export const getAnswer: RequestHandler = factory.getOne(Answer);
export const getAllAnswers: RequestHandler = factory.getAll(Answer);
export const updateAnswer: RequestHandler = factory.updateOne(Answer);
export const deleteAnswer: RequestHandler = factory.deleteOne(Answer);