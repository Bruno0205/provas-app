import express from 'express';
import controller from '../controllers/examsController';

const router = express.Router();

router.use('/', controller);

export default router;
