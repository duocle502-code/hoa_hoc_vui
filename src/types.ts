export type ApparatusType = 'beaker' | 'test-tube';

export interface LabEquipment {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  width: number;
  height: number;
}

export interface PlacedEquipment {
  id: string; // Unique ID for each instance on the canvas
  equipmentId: string; // Refers to LabEquipment.id
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  // Chemical state
  chemicals: string[];
  color: string;
  bubbles: boolean;
  precipitate: boolean;
  message: string;
  isReacting: boolean;
}

export interface Chemical {
  id: string;
  name: string;
  formula: string;
  color: string;
  state: 'solid' | 'liquid' | 'gas';
  properties: string;
  concentration?: string;
  safetyWarnings: string[];
  description: string;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  chemicals: string[];
  steps: string[];
  expectedResult: string;
  equation: string;
}

export interface Question {
  id: string;
  subjectId: string;
  content: string;
  type: 'multiple-choice' | 'true-false';
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Session {
  id: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  date: string;
}

export interface AppData {
  subjects: { id: string; name: string; icon: string; questionsCount: number }[];
  questions: Question[];
  sessions: Session[];
  progress: {
    totalAttempts: number;
    averageScore: number;
    streakDays: number;
    weakTopics: string[];
  };
  settings: {
    theme: 'light' | 'dark';
    soundEnabled: boolean;
    autoSave: boolean;
    model: string;
  };
}
