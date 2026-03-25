import { Router } from 'express';
import { Exam } from '../models';
import { examsService } from '../services/examsService';

const router = Router();

router.get('/', (req, res) => {
  res.json(examsService.list());
});

router.get('/:id', (req, res) => {
  const exam = examsService.get(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Not found' });
  res.json(exam);
});

router.post('/', (req, res) => {
  const payload = req.body as Partial<Exam>;
  const result = examsService.create(payload);
  if (result.error) return res.status(400).json({ message: result.error });
  res.status(201).json(result.exam);
});

router.put('/:id', (req, res) => {
  const payload = req.body as Partial<Exam>;
  const result = examsService.update(req.params.id, payload);
  if (result.error === 'Not found') return res.status(404).json({ message: result.error });
  if (result.error) return res.status(400).json({ message: result.error });
  res.json(result.exam);
});

router.delete('/:id', (req, res) => {
  const ok = examsService.remove(req.params.id);
  if (!ok) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

router.post('/:id/generate', async (req, res) => {
  const numberOfExams = Number(req.body?.numberOfExams);
  const result = await examsService.generate(req.params.id, numberOfExams);

  if (result.error === 'Not found') {
    return res.status(404).json({ message: result.error });
  }

  if (result.error || !result.zipBuffer || !result.fileName) {
    return res.status(400).json({ message: result.error || 'Could not generate exam files' });
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
  res.send(result.zipBuffer);
});

export default router;
