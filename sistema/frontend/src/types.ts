export interface Alternative {
  id: string;
  text: string;
  correct: boolean;
}

export interface Question {
  id: string;
  description: string;
  alternatives: Alternative[];
}
