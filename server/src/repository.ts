import fs from 'fs';
import path from 'path';
import { Exam, Question } from './models';

const QUESTIONS_DATA_PATH = path.join(__dirname, '..', 'data', 'questions.json');
const EXAMS_DATA_PATH = path.join(__dirname, '..', 'data', 'exams.json');

function loadData(): Question[] {
  try {
    const raw = fs.readFileSync(QUESTIONS_DATA_PATH, 'utf8');
    return JSON.parse(raw) as Question[];
  } catch (err) {
    return [];
  }
}

function saveData(questions: Question[]) {
  fs.mkdirSync(path.dirname(QUESTIONS_DATA_PATH), { recursive: true });
  fs.writeFileSync(QUESTIONS_DATA_PATH, JSON.stringify(questions, null, 2), 'utf8');
}

function loadExams(): Exam[] {
  try {
    const raw = fs.readFileSync(EXAMS_DATA_PATH, 'utf8');
    return JSON.parse(raw) as Exam[];
  } catch (err) {
    return [];
  }
}

function saveExams(exams: Exam[]) {
  fs.mkdirSync(path.dirname(EXAMS_DATA_PATH), { recursive: true });
  fs.writeFileSync(EXAMS_DATA_PATH, JSON.stringify(exams, null, 2), 'utf8');
}

export const repository = {
  getAll(): Question[] {
    return loadData();
  },
  getById(id: string): Question | undefined {
    const all = loadData();
    return all.find((q) => q.id === id);
  },
  create(question: Question): Question {
    const all = loadData();
    all.push(question);
    saveData(all);
    return question;
  },
  update(id: string, patch: Partial<Question>): Question | undefined {
    const all = loadData();
    const idx = all.findIndex((q) => q.id === id);
    if (idx === -1) return undefined;
    const updated = { ...all[idx], ...patch } as Question;
    all[idx] = updated;
    saveData(all);
    return updated;
  },
  remove(id: string): boolean {
    const all = loadData();
    const filtered = all.filter((q) => q.id !== id);
    if (filtered.length === all.length) return false;
    saveData(filtered);
    return true;
  }
};

export const examsRepository = {
  getAll(): Exam[] {
    return loadExams();
  },
  getById(id: string): Exam | undefined {
    const all = loadExams();
    return all.find((exam) => exam.id === id);
  },
  create(exam: Exam): Exam {
    const all = loadExams();
    all.push(exam);
    saveExams(all);
    return exam;
  },
  update(id: string, patch: Partial<Exam>): Exam | undefined {
    const all = loadExams();
    const idx = all.findIndex((exam) => exam.id === id);
    if (idx === -1) return undefined;
    const updated = { ...all[idx], ...patch } as Exam;
    all[idx] = updated;
    saveExams(all);
    return updated;
  },
  remove(id: string): boolean {
    const all = loadExams();
    const filtered = all.filter((exam) => exam.id !== id);
    if (filtered.length === all.length) return false;
    saveExams(filtered);
    return true;
  }
};
