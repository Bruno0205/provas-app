import { repository } from '../repository';
import { Question } from '../models';

export const questionsService = {
  list(): Question[] {
    return repository.getAll();
  },
  get(id: string): Question | undefined {
    return repository.getById(id);
  },
  create(question: Question): Question {
    return repository.create(question);
  },
  update(id: string, patch: Partial<Question>): Question | undefined {
    return repository.update(id, patch);
  },
  remove(id: string): boolean {
    return repository.remove(id);
  }
};
