export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export type ExamType = 'JEE' | 'NEET' | 'UPSC';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
  topic: string;
  examType?: ExamType;
}

export interface UserStats {
  questionsAttempted: number;
  questionsCorrect: number;
  streak: number;
  weakAreas: string[];
  recentScores: { date: string; score: number }[];
  topicMastery: { topic: string; mastery: number }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isAudio?: boolean;
}

export interface StudyTask {
  day: string;
  tasks: string[];
  focus: string;
}

export type View = 'practice' | 'doubts' | 'planner';
