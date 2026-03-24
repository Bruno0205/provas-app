const BASE = 'http://localhost:4000';

export type Alternative = { id: string; text: string; correct: boolean };
export type Question = { id: string; text: string; alternatives: Alternative[] };

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
  }
};
