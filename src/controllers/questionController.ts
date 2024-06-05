import { RequestHandler } from "express";
import { Question } from "./../model/question";
import * as factory from "./handlerFactory";

export const createQuestion = factory.createOne(Question);
export const getQuestion: RequestHandler = factory.getOne(Question);
export const getAllQuestions: RequestHandler = factory.getAll(Question);
export const updateQuestion: RequestHandler = factory.updateOne(Question);
export const deleteQuestion: RequestHandler = factory.deleteOne(Question);