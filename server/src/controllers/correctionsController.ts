import { Router } from 'express';
import multer from 'multer';
import { GradingMode } from '../models';
import { correctionsService } from '../services/correctionsService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const filesUpload = upload.fields([
  { name: 'answerKeyFile', maxCount: 1 },
  { name: 'responsesFile', maxCount: 1 }
]);

router.post('/preview', filesUpload, (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const answerKeyFile = files?.answerKeyFile?.[0];
  const responsesFile = files?.responsesFile?.[0];

  if (!answerKeyFile || !responsesFile) {
    return res.status(400).json({
      message: 'Both answerKeyFile and responsesFile are required'
    });
  }

  const gradingMode = String(req.body?.gradingMode || '').toUpperCase() as GradingMode;
  const process = correctionsService.process(
    answerKeyFile.buffer.toString('utf8'),
    responsesFile.buffer.toString('utf8'),
    gradingMode
  );

  if (process.error || !process.result) {
    return res.status(400).json({ message: process.error || 'Could not process correction files' });
  }

  res.json({
    summary: process.result.summary,
    results: process.result.results,
    errors: process.result.errors,
    questionKeys: process.result.questionKeys
  });
});

router.post('/report', filesUpload, (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const answerKeyFile = files?.answerKeyFile?.[0];
  const responsesFile = files?.responsesFile?.[0];

  if (!answerKeyFile || !responsesFile) {
    return res.status(400).json({
      message: 'Both answerKeyFile and responsesFile are required'
    });
  }

  const gradingMode = String(req.body?.gradingMode || '').toUpperCase() as GradingMode;
  const process = correctionsService.process(
    answerKeyFile.buffer.toString('utf8'),
    responsesFile.buffer.toString('utf8'),
    gradingMode
  );

  if (process.error || !process.result) {
    return res.status(400).json({ message: process.error || 'Could not build report' });
  }

  const fileName = `class-report-${gradingMode.toLowerCase() || 'strict'}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(process.result.reportCsv);
});

export default router;
