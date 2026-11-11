import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Deck,
  Flashcard,
  Quiz,
  QuizSubmission,
  StudyMaterial,
  TutorMessage,
  TutorPersona,
  UserStats,
  DiagnosticRecommendation,
} from '../types';
import {
  INITIAL_DECKS,
  INITIAL_FLASHCARDS,
  INITIAL_QUIZZES,
  INITIAL_MATERIALS,
  INITIAL_USER_STATS,
} from '../data/initialData';
import { soundController } from '../utils/soundscapes';

interface StudyContextType {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Decks & Flashcards
  decks: Deck[];
  flashcards: Flashcard[];
  createDeck: (title: string, description: string, category: string, color?: string) => Deck;
  deleteDeck: (deckId: string) => void;
  addFlashcards: (cards: Array<Omit<Flashcard, 'id' | 'intervalDays' | 'repetitions' | 'easeFactor' | 'nextReviewDate'>>) => void;
  reviewFlashcard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  getCardsForDeck: (deckId: string) => Flashcard[];
  getDueCards: (deckId?: string) => Flashcard[];

  // Quizzes & Submissions
  quizzes: Quiz[];
  submissions: QuizSubmission[];
  addQuiz: (quiz: Omit<Quiz, 'id' | 'createdAt'>) => Quiz;
  saveQuizSubmission: (submission: Omit<QuizSubmission, 'id' | 'completedAt'>) => void;
  getQuizById: (id: string) => Quiz | undefined;

  // Study Materials
  materials: StudyMaterial[];
  addMaterial: (material: Omit<StudyMaterial, 'id' | 'createdAt'>) => StudyMaterial;
  toggleBookmarkMaterial: (materialId: string) => void;
  deleteMaterial: (materialId: string) => void;

  // Tutor Chat
  tutorMessages: TutorMessage[];
  tutorPersona: TutorPersona;
  setTutorPersona: (persona: TutorPersona) => void;
  sendTutorMessage: (message: string, context?: string) => Promise<void>;
  isTutorLoading: boolean;
  clearTutorChat: () => void;

  // User Stats & Diagnostics
  stats: UserStats;
  recommendations: DiagnosticRecommendation | null;
  refreshRecommendations: () => Promise<void>;
  isLoadingRecommendations: boolean;

  // Pomodoro Timer & Audio
  pomodoroSeconds: number;
  pomodoroMode: 'focus' | 'break';
  isPomodoroRunning: boolean;
  togglePomodoro: () => void;
  resetPomodoro: (mode?: 'focus' | 'break') => void;
  soundscapeMode: 'off' | 'rain' | 'whitenoise' | 'alpha';
  setSoundscapeMode: (mode: 'off' | 'rain' | 'whitenoise' | 'alpha') => void;

  // Active study target helper
  activeQuizId: string | null;
  setActiveQuizId: (id: string | null) => void;
  activeDeckId: string | null;
  setActiveDeckId: (id: string | null) => void;
  activeMaterialId: string | null;
  setActiveMaterialId: (id: string | null) => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const STORAGE_KEYS = {
  DECKS: 'cognitio_decks_v2',
  CARDS: 'cognitio_flashcards_v2',
  QUIZZES: 'cognitio_quizzes_v2',
  SUBMISSIONS: 'cognitio_submissions_v2',
  MATERIALS: 'cognitio_materials_v2',
  STATS: 'cognitio_stats_v2',
  TUTOR: 'cognitio_tutor_v2',
};

export const StudyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);

  // Decks & Flashcards
  const [decks, setDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DECKS);
    return saved ? JSON.parse(saved) : INITIAL_DECKS;
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
    return saved ? JSON.parse(saved) : INITIAL_FLASHCARDS;
  });

  // Quizzes & Submissions
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    return saved ? JSON.parse(saved) : INITIAL_QUIZZES;
  });

  const [submissions, setSubmissions] = useState<QuizSubmission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return saved ? JSON.parse(saved) : [];
  });

  // Materials
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  // Stats
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    return saved ? JSON.parse(saved) : INITIAL_USER_STATS;
  });

  // Tutor
  const [tutorPersona, setTutorPersona] = useState<TutorPersona>('feynman');
  const [isTutorLoading, setIsTutorLoading] = useState<boolean>(false);
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TUTOR);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'welcome-1',
        role: 'model',
        content: `Olá! Sou seu **Mentor Cognitivo** no Cognitio Studio. 🎯\n\nEstou configurado no modo **Método Feynman** — pronto para transformar qualquer assunto complexo (de farmacologia a algoritmos concorrentes) em explicações simples, com analogias vívidas da vida real.\n\nQual conceito ou dúvida você quer dominar hoje?`,
        persona: 'feynman',
        timestamp: new Date().toISOString(),
        suggestedFollowUps: [
          'Me explique o Teorema CAP com uma analogia simples',
          'Como funciona a cascata de coagulação de forma visual?',
          'Qual a diferença entre controle difuso e concentrado?',
        ],
      },
    ];
  });

  // Recommendations
  const [recommendations, setRecommendations] = useState<DiagnosticRecommendation | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);

  // Pomodoro & Sound
  const [pomodoroSeconds, setPomodoroSeconds] = useState<number>(25 * 60);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus');
  const [isPomodoroRunning, setIsPomodoroRunning] = useState<boolean>(false);
  const [soundscapeMode, setSoundscapeMode] = useState<'off' | 'rain' | 'whitenoise' | 'alpha'>('off');

  // Persistence side-effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  }, [decks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(flashcards));
  }, [flashcards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TUTOR, JSON.stringify(tutorMessages));
  }, [tutorMessages]);

  // Pomodoro interval ticker
  useEffect(() => {
    let timer: any;
    if (isPomodoroRunning && pomodoroSeconds > 0) {
      timer = setInterval(() => {
        setPomodoroSeconds((prev) => {
          if (prev <= 1) {
            // Timer finished
            soundController.playSuccessChime();
            setIsPomodoroRunning(false);
            if (pomodoroMode === 'focus') {
              setStats((s) => ({ ...s, totalStudyMinutes: s.totalStudyMinutes + 25 }));
              return 5 * 60;
            } else {
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPomodoroRunning, pomodoroSeconds, pomodoroMode]);

  // Global keyboard shortcuts (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update soundscape when mode changes
  const handleSetSoundscapeMode = (mode: 'off' | 'rain' | 'whitenoise' | 'alpha') => {
    setSoundscapeMode(mode);
    soundController.setAmbience(mode);
  };

  const togglePomodoro = () => {
    setIsPomodoroRunning((prev) => !prev);
  };

  const resetPomodoro = (mode: 'focus' | 'break' = 'focus') => {
    setIsPomodoroRunning(false);
    setPomodoroMode(mode);
    setPomodoroSeconds(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  // Deck methods
  const createDeck = (title: string, description: string, category: string, color: string = '#6366F1') => {
    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      title,
      description,
      category,
      color,
      cardCount: 0,
      dueTodayCount: 0,
      totalCardsReviewed: 0,
      averageMastery: 100,
      createdAt: new Date().toISOString(),
    };
    setDecks((prev) => [newDeck, ...prev]);
    return newDeck;
  };

  const deleteDeck = (deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    setFlashcards((prev) => prev.filter((c) => c.deckId !== deckId));
    if (activeDeckId === deckId) setActiveDeckId(null);
  };

  const addFlashcards = (
    newCards: Array<Omit<Flashcard, 'id' | 'intervalDays' | 'repetitions' | 'easeFactor' | 'nextReviewDate'>>
  ) => {
    const nowIso = new Date().toISOString();
    const createdCards: Flashcard[] = newCards.map((c, i) => ({
      ...c,
      id: `card-${Date.now()}-${i}`,
      intervalDays: 1,
      repetitions: 0,
      easeFactor: 2.5,
      nextReviewDate: nowIso,
    }));

    setFlashcards((prev) => [...createdCards, ...prev]);

    // Update deck card count
    const deckCounts: Record<string, number> = {};
    for (const c of createdCards) {
      deckCounts[c.deckId] = (deckCounts[c.deckId] || 0) + 1;
    }
    setDecks((prev) =>
      prev.map((d) => {
        if (deckCounts[d.id]) {
          return {
            ...d,
            cardCount: (d.cardCount || 0) + deckCounts[d.id],
            dueTodayCount: (d.dueTodayCount || 0) + deckCounts[d.id],
          };
        }
        return d;
      })
    );
  };

  // SM-2 Spaced Repetition evaluation
  const reviewFlashcard = (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    const card = flashcards.find((c) => c.id === cardId);
    if (!card) return;

    soundController.playFlipSound();
    if (rating === 'good' || rating === 'easy') {
      soundController.playSuccessChime();
    }

    let interval = card.intervalDays || 1;
    let repetitions = card.repetitions || 0;
    let ease = card.easeFactor || 2.5;

    if (rating === 'again') {
      repetitions = 0;
      interval = 1;
      ease = Math.max(1.3, ease - 0.2);
    } else if (rating === 'hard') {
      repetitions = repetitions + 1;
      interval = Math.max(1, Math.round(interval * 1.2));
      ease = Math.max(1.3, ease - 0.15);
    } else if (rating === 'good') {
      repetitions = repetitions + 1;
      interval = repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.round(interval * ease);
    } else if (rating === 'easy') {
      repetitions = repetitions + 1;
      interval = repetitions === 1 ? 2 : repetitions === 2 ? 4 : Math.round(interval * ease * 1.3);
      ease = ease + 0.15;
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    setFlashcards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              intervalDays: interval,
              repetitions,
              easeFactor: Number(ease.toFixed(2)),
              lastRating: rating,
              lastReviewedDate: new Date().toISOString(),
              nextReviewDate: nextDate.toISOString(),
            }
          : c
      )
    );

    // Update global user stats
    setStats((prev) => {
      const isCorrect = rating === 'good' || rating === 'easy';
      const prevDeck = decks.find((d) => d.id === card.deckId);
      const topicName = prevDeck ? prevDeck.title : 'Geral';
      const currentTopic = prev.accuracyByTopic[topicName] || { correct: 0, total: 0, percentage: 80 };
      const newCorrect = currentTopic.correct + (isCorrect ? 1 : 0);
      const newTotal = currentTopic.total + 1;

      return {
        ...prev,
        totalCardsReviewed: prev.totalCardsReviewed + 1,
        totalStudyMinutes: prev.totalStudyMinutes + 1,
        accuracyByTopic: {
          ...prev.accuracyByTopic,
          [topicName]: {
            correct: newCorrect,
            total: newTotal,
            percentage: Math.round((newCorrect / newTotal) * 100),
          },
        },
      };
    });
  };

  const getCardsForDeck = (deckId: string) => {
    return flashcards.filter((c) => c.deckId === deckId);
  };

  const getDueCards = (deckId?: string) => {
    const now = new Date();
    return flashcards.filter((c) => {
      if (deckId && c.deckId !== deckId) return false;
      if (!c.nextReviewDate) return true;
      return new Date(c.nextReviewDate) <= now;
    });
  };

  // Quizzes
  const addQuiz = (newQuiz: Omit<Quiz, 'id' | 'createdAt'>) => {
    const quiz: Quiz = {
      ...newQuiz,
      id: `quiz-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setQuizzes((prev) => [quiz, ...prev]);
    return quiz;
  };

  const saveQuizSubmission = (submissionData: Omit<QuizSubmission, 'id' | 'completedAt'>) => {
    const submission: QuizSubmission = {
      ...submissionData,
      id: `sub-${Date.now()}`,
      completedAt: new Date().toISOString(),
    };
    setSubmissions((prev) => [submission, ...prev]);

    // Update quiz bestScore
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === submission.quizId
          ? {
              ...q,
              completedAt: submission.completedAt,
              bestScore: Math.max(q.bestScore || 0, submission.score),
            }
          : q
      )
    );

    // Update user stats
    setStats((prev) => {
      const topic = submission.topic || 'Geral';
      const cur = prev.accuracyByTopic[topic] || { correct: 0, total: 0, percentage: 70 };
      const newCorrect = cur.correct + submission.correctCount;
      const newTotal = cur.total + submission.totalQuestions;

      const totalQuizzes = prev.totalQuizzesTaken + 1;
      const newAvg = Math.round((prev.averageAccuracyRate * prev.totalQuizzesTaken + submission.score) / totalQuizzes);

      return {
        ...prev,
        totalQuizzesTaken: totalQuizzes,
        averageAccuracyRate: newAvg,
        totalStudyMinutes: prev.totalStudyMinutes + Math.round(submission.timeSpentSeconds / 60),
        accuracyByTopic: {
          ...prev.accuracyByTopic,
          [topic]: {
            correct: newCorrect,
            total: newTotal,
            percentage: Math.round((newCorrect / newTotal) * 100),
          },
        },
      };
    });
  };

  const getQuizById = (id: string) => {
    return quizzes.find((q) => q.id === id);
  };

  // Materials
  const addMaterial = (mat: Omit<StudyMaterial, 'id' | 'createdAt'>) => {
    const newMaterial: StudyMaterial = {
      ...mat,
      id: `mat-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isBookmarked: false,
    };
    setMaterials((prev) => [newMaterial, ...prev]);
    return newMaterial;
  };

  const toggleBookmarkMaterial = (materialId: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, isBookmarked: !m.isBookmarked } : m))
    );
  };

  const deleteMaterial = (materialId: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    if (activeMaterialId === materialId) setActiveMaterialId(null);
  };

  // Tutor
  const sendTutorMessage = async (content: string, context?: string) => {
    const userMsg: TutorMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content,
      persona: tutorPersona,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...tutorMessages, userMsg];
    setTutorMessages(nextHistory);
    setIsTutorLoading(true);

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: tutorPersona,
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          topicContext: context || '',
        }),
      });

      if (!res.ok) {
        throw new Error(`Erro na resposta da API (${res.status})`);
      }

      const data = await res.json();
      const replyText = data.reply || 'Desculpe, não consegui formular a explicação agora.';

      // Extract follow up questions if model formatted them
      const followUps: string[] = [];
      const lines = replyText.split('\n');
      for (const l of lines) {
        const trimmed = l.trim();
        if ((trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('-')) && trimmed.includes('?')) {
          followUps.push(trimmed.replace(/^[0-9.-]+\s*/, '').replace(/\*+/g, ''));
        }
      }

      const aiMsg: TutorMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: replyText,
        persona: tutorPersona,
        timestamp: new Date().toISOString(),
        suggestedFollowUps: followUps.slice(0, 3),
      };

      setTutorMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: TutorMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ Ocorreu uma oscilação na conexão com a inteligência do Cognitio Studio (${err.message || 'Erro de rede'}). Por favor, certifique-se de que sua chave de API esteja configurada ou tente novamente em instantes.`,
        persona: tutorPersona,
        timestamp: new Date().toISOString(),
      };
      setTutorMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTutorLoading(false);
    }
  };

  const clearTutorChat = () => {
    setTutorMessages([]);
  };

  // Recommendations
  const refreshRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const historyPayload = {
        stats,
        weakestDecks: decks.map((d) => ({
          title: d.title,
          cardsDue: getDueCards(d.id).length,
          accuracy: stats.accuracyByTopic[d.title]?.percentage ?? 75,
        })),
        recentSubmissions: submissions.slice(0, 5),
      };

      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performanceHistory: historyPayload }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.recommendations) {
          setRecommendations(data.recommendations);
        }
      }
    } catch (e) {
      console.error('Failed to refresh recommendations', e);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  return (
    <StudyContext.Provider
      value={{
        activeTab,
        setActiveTab,
        commandPaletteOpen,
        setCommandPaletteOpen,

        decks,
        flashcards,
        createDeck,
        deleteDeck,
        addFlashcards,
        reviewFlashcard,
        getCardsForDeck,
        getDueCards,

        quizzes,
        submissions,
        addQuiz,
        saveQuizSubmission,
        getQuizById,

        materials,
        addMaterial,
        toggleBookmarkMaterial,
        deleteMaterial,

        tutorMessages,
        tutorPersona,
        setTutorPersona,
        sendTutorMessage,
        isTutorLoading,
        clearTutorChat,

        stats,
        recommendations,
        refreshRecommendations,
        isLoadingRecommendations,

        pomodoroSeconds,
        pomodoroMode,
        isPomodoroRunning,
        togglePomodoro,
        resetPomodoro,
        soundscapeMode,
        setSoundscapeMode: handleSetSoundscapeMode,

        activeQuizId,
        setActiveQuizId,
        activeDeckId,
        setActiveDeckId,
        activeMaterialId,
        setActiveMaterialId,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const ctx = useContext(StudyContext);
  if (!ctx) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return ctx;
};
