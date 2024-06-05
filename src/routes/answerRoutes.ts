import express from 'express';
import * as answerController from './../controllers/answerController';

const router = express.Router();

router
  .route('/')
  .get(answerController.getAllAnswers)
  .post(answerController.createAnswer);

router
  .route('/:id')
  .get(answerController.getAnswer)
  .patch(answerController.updateAnswer)
  .delete(answerController.deleteAnswer);

export default router;
