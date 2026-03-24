import express from 'express';
import controller from '../controllers/questionsController';

const router = express.Router();

router.use('/', controller);

export default router;
