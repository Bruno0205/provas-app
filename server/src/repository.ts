import fs from 'fs';
import path from 'path';
import { Question } from './models';

const DATA_PATH = path.join(__dirname, '..', 'data', 'questions.json');

function loadData(): Question[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw) as Question[];
  } catch (err) {
    return [];
  }
}

function saveData(questions: Question[]) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(questions, null, 2), 'utf8');
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
