export type Alternative = {
  id: string;
  text: string;
  correct: boolean;
};

export type Question = {
  id: string;
  text: string;
  alternatives: Alternative[];
};

export type AlternativeLabelType = 'LETTERS' | 'POWERS_OF_TWO';
export type GradingMode = 'STRICT' | 'LENIENT';

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
