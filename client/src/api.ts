const BASE = 'http://localhost:4000';

export type Alternative = { id: string; text: string; correct: boolean };
export type Question = { id: string; text: string; alternatives: Alternative[] };
export type AlternativeLabelType = 'LETTERS' | 'POWERS_OF_TWO';
export type Exam = {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  date: string;
  instructions?: string;
  alternativeLabelType: AlternativeLabelType;
  questionIds: string[];
};
export type ExamDetails = Exam & { questions: Question[] };

async function handleRes(res: Response) {
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'API error');
  return data;
}

export const api = {
  async listQuestions() {
    const res = await fetch(`${BASE}/questions`);
    return (await handleRes(res)) as Question[];
  },
  async getQuestion(id: string) {
    const res = await fetch(`${BASE}/questions/${id}`);
    return (await handleRes(res)) as Question;
  },
  async createQuestion(payload: Partial<Question>) {
    const res = await fetch(`${BASE}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return (await handleRes(res)) as Question;
  },
  async updateQuestion(id: string, payload: Partial<Question>) {
    const res = await fetch(`${BASE}/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return (await handleRes(res)) as Question;
  },
  async deleteQuestion(id: string) {
    const res = await fetch(`${BASE}/questions/${id}`, { method: 'DELETE' });
    return (await handleRes(res)) as null;
  },

  async listExams() {
    const res = await fetch(`${BASE}/exams`);
    return (await handleRes(res)) as Exam[];
  },

  async getExam(id: string) {
    const res = await fetch(`${BASE}/exams/${id}`);
    return (await handleRes(res)) as ExamDetails;
  },

  async createExam(payload: Partial<Exam>) {
    const res = await fetch(`${BASE}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return (await handleRes(res)) as Exam;
  },

  async updateExam(id: string, payload: Partial<Exam>) {
    const res = await fetch(`${BASE}/exams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return (await handleRes(res)) as Exam;
  },

  async deleteExam(id: string) {
    const res = await fetch(`${BASE}/exams/${id}`, { method: 'DELETE' });
    return (await handleRes(res)) as null;
  },

  async generateExamFiles(id: string, numberOfExams: number) {
    const res = await fetch(`${BASE}/exams/${id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numberOfExams })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.message || 'API error');
    }

    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/i);
    const fileName = match?.[1] || 'generated-exams.zip';
    const blob = await res.blob();

    return { fileName, blob };
  }
};
