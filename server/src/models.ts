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
