import express from 'express';
import * as subscriptionController from './../controllers/subscriptionController';
import { protect, restrictTo } from './../controllers/authController';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(subscriptionController.getAllSubscriptions)
  .post(restrictTo('admin'), subscriptionController.createSubscription);

router
  .route('/:id')
  .get(subscriptionController.getSubscription)
  .patch(restrictTo('admin'), subscriptionController.updateSubscription)
  .delete(restrictTo('admin'), subscriptionController.deleteSubscription);

export default router;
