import { Router } from 'express';
import { questionsService } from '../services/questionsService';
import { Question } from '../models';

const router = Router();

router.get('/', (req, res) => {
  res.json(questionsService.list());
});

router.get('/:id', (req, res) => {
  const q = questionsService.get(req.params.id);
  if (!q) return res.status(404).json({ message: 'Not found' });
  res.json(q);
});

router.post('/', (req, res) => {
  const payload = req.body as Partial<Question>;
  if (!payload || typeof payload.text !== 'string') {
    return res.status(400).json({ message: 'Invalid payload' });
  }
  const id = String(Date.now()) + Math.random().toString(36).slice(2, 9);
  const question: Question = {
    id,
    text: payload.text,
    alternatives: Array.isArray(payload.alternatives) ? payload.alternatives : []
  };
  const created = questionsService.create(question);
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const patch = req.body as Partial<Question>;
  const updated = questionsService.update(req.params.id, patch);
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const ok = questionsService.remove(req.params.id);
  if (!ok) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

export default router;
