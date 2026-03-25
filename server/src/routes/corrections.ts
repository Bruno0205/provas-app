import express from 'express';
import controller from '../controllers/correctionsController';

const router = express.Router();

router.use('/', controller);

export default router;
