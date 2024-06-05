import express from 'express';
import * as testController from './../controllers/testController';
import { protect } from './../controllers/authController';

const router = express.Router();

router.use(protect);

router.route('/').get(testController.getTest);
router.route('/all').get(testController.getAllTests);

export default router;
