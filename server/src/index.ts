import express from 'express';
import cors from 'cors';
import questionsRouter from './routes/questions';
import examsRouter from './routes/exams';
import path from 'path';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/questions', questionsRouter);
app.use('/exams', examsRouter);

app.get('/', (req, res) => res.send({ ok: true }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});
