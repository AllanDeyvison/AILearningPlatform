export type Difficulty = 'iniciante' | 'intermediario' | 'avancado' | 'easy' | 'medium' | 'hard';

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mnemonicHint?: string;
  // Spaced Repetition (SM-2 simplified)
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string; // ISO date string
  lastReviewedDate?: string;
  lastRating?: 'again' | 'hard' | 'good' | 'easy';
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  cardCount?: number;
  dueTodayCount?: number;
  totalCardsReviewed?: number;
  averageMastery?: number; // 0 to 100
  createdAt: string;
}

export interface QuizOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'open_ended';
  prompt: string;
  options?: QuizOption[];
  correctOptionId?: string;
  generalExplanation?: string;
  keyConcepts?: string[];
  // For open-ended questions
  sampleModelAnswer?: string;
  rubricKeyPoints?: string[];
}

export interface OpenEndedEvaluation {
  score: number; // 0 to 100
  verdict: string;
  generalFeedback: string;
  strengths: string[];
  gapsOrMisconceptions: string[];
  modelAnswerComparison: string;
  suggestedReviewFocus: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: 'iniciante' | 'intermediario' | 'avancado';
  questionCount: number;
  timeLimitMinutes?: number;
  questions: QuizQuestion[];
  createdAt: string;
  completedAt?: string;
  bestScore?: number;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  quizTitle: string;
  topic: string;
  score: number; // percentage 0-100
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  completedAt: string;
  answers: {
    questionId: string;
    selectedOptionId?: string;
    studentTextAnswer?: string;
    isCorrect?: boolean;
    openEvaluation?: OpenEndedEvaluation;
  }[];
}

export interface StudyMaterial {
  id: string;
  title: string;
  topic: string;
  overview: string;
  keyPoints: {
    title: string;
    explanation: string;
  }[];
  mnemonics: string[];
  comparisonTable?: {
    headers: string[];
    rows: string[][];
  };
  fixationQuestions?: {
    question: string;
    answer: string;
  }[];
  practicalApplication?: string;
  nextStudyTopics: string[];
  createdAt: string;
  isBookmarked?: boolean;
}

export type TutorPersona = 'feynman' | 'socratic' | 'academic';

export interface TutorMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  persona?: TutorPersona;
  timestamp: string;
  suggestedFollowUps?: string[];
}

export interface DiagnosticRecommendation {
  diagnosticSummary: string;
  retentionScoreEstimate: number;
  weakestTopics: {
    topic: string;
    reason: string;
    recommendedAction: string;
    urgency: 'alta' | 'media' | 'baixa';
  }[];
  strongTopics: string[];
  todayActionPlan: {
    task: string;
    timeMinutes: number;
    type: 'simulado' | 'flashcards' | 'resumo' | 'tutor';
  }[];
  motivationalCognitiveTip: string;
}

export interface UserStats {
  streakDays: number;
  lastStudyDate: string;
  totalStudyMinutes: number;
  totalCardsReviewed: number;
  totalQuizzesTaken: number;
  averageAccuracyRate: number; // 0 to 100
  accuracyByTopic: Record<string, { correct: number; total: number; percentage: number }>;
}
