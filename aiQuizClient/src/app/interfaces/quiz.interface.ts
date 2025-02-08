export interface QCMQuestion {
  id: number;
  question: string;
  options: string[];
  answer: string;
}

export interface OuiNonQuestion {
  id: number;
  question: string;
  answer: string;
}

export interface ReponseCourteQuestion {
  id: number;
  question: string;
  answer: string;
}

export interface Quiz {
  qcm: QCMQuestion[];
  oui_non: OuiNonQuestion[];
  reponse_courte: ReponseCourteQuestion[];
} 