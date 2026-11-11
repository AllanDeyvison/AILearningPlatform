import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Flag,
  Award,
  BookOpen,
  RefreshCw,
  Loader2,
  FileText,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStudy } from '../../context/StudyContext';
import { Quiz, QuizQuestion, OpenEndedEvaluation, QuizSubmission } from '../../types';
import { soundController } from '../../utils/soundscapes';

interface QuizCenterViewProps {
  onOpenCreateQuizModal: () => void;
}

export const QuizCenterView: React.FC<QuizCenterViewProps> = ({ onOpenCreateQuizModal }) => {
  const {
    quizzes,
    submissions,
    saveQuizSubmission,
    activeQuizId,
    setActiveQuizId,
    addFlashcards,
    decks,
    setActiveTab,
  } = useStudy();

  // State for active quiz run
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [openEvaluations, setOpenEvaluations] = useState<Record<string, OpenEndedEvaluation>>({});
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [latestSubmission, setLatestSubmission] = useState<QuizSubmission | null>(null);

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId);

  // Initialize quiz run
  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuizId(quiz.id);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setOpenEvaluations({});
    setIsCompleted(false);
    setLatestSubmission(null);
    setTimeRemaining((quiz.timeLimitMinutes || 10) * 60);
  };

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (activeQuiz && !isCompleted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleFinishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuiz, isCompleted, timeRemaining]);

  // Finish and compute scores
  const handleFinishQuiz = () => {
    if (!activeQuiz) return;

    let correctCount = 0;
    const answerRecords = activeQuiz.questions.map((q) => {
      if (q.type === 'multiple_choice') {
        const selected = userAnswers[q.id];
        const isCorrect = selected === q.correctOptionId;
        if (isCorrect) correctCount++;
        return {
          questionId: q.id,
          selectedOptionId: selected,
          isCorrect,
        };
      } else {
        // Open ended evaluation score
        const evalResult = openEvaluations[q.id];
        const isCorrect = (evalResult?.score || 0) >= 70;
        if (isCorrect) correctCount++;
        return {
          questionId: q.id,
          studentTextAnswer: userAnswers[q.id] || '',
          isCorrect,
          openEvaluation: evalResult,
        };
      }
    });

    const totalQuestions = activeQuiz.questions.length;
    const finalScore = Math.round((correctCount / totalQuestions) * 100);
    const timeSpent = (activeQuiz.timeLimitMinutes || 10) * 60 - timeRemaining;

    const submissionData = {
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      topic: activeQuiz.topic,
      score: finalScore,
      correctCount,
      totalQuestions,
      timeSpentSeconds: Math.max(15, timeSpent),
      answers: answerRecords,
    };

    saveQuizSubmission(submissionData);
    setLatestSubmission({
      ...submissionData,
      id: `sub-${Date.now()}`,
      completedAt: new Date().toISOString(),
    });
    setIsCompleted(true);

    if (finalScore >= 75) {
      soundController.playSuccessChime();
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch {}
    }
  };

  // Evaluate open-ended answer with Gemini API
  const handleEvaluateOpenAnswer = async (question: QuizQuestion) => {
    const studentAnswer = userAnswers[question.id];
    if (!studentAnswer || !studentAnswer.trim()) return;

    setEvaluatingQuestionId(question.id);
    try {
      const res = await fetch('/api/ai/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionPrompt: question.prompt,
          studentAnswer: studentAnswer,
          rubricKeyPoints: question.rubricKeyPoints || [],
          sampleModelAnswer: question.sampleModelAnswer || '',
        }),
      });

      if (!res.ok) {
        throw new Error('Falha na resposta do servidor.');
      }

      const data = await res.json();
      if (data.evaluation) {
        setOpenEvaluations((prev) => ({
          ...prev,
          [question.id]: data.evaluation,
        }));
        if (data.evaluation.score >= 70) {
          soundController.playSuccessChime();
        }
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao avaliar resposta. Verifique a conexão com a API.');
    } finally {
      setEvaluatingQuestionId(null);
    }
  };

  // Convert wrong questions from latest submission into active flashcards!
  const handleCreateCardsFromMistakes = () => {
    if (!latestSubmission || !activeQuiz) return;
    const wrongAnswers = latestSubmission.answers.filter((a) => !a.isCorrect);
    if (wrongAnswers.length === 0) return;

    const targetDeckId = decks[0]?.id || 'deck-1';
    const cardsToCreate = wrongAnswers.map((ans) => {
      const question = activeQuiz.questions.find((q) => q.id === ans.questionId);
      const correctAnswerText =
        question?.type === 'multiple_choice'
          ? question.options?.find((o) => o.id === question.correctOptionId)?.text
          : question?.sampleModelAnswer;

      return {
        deckId: targetDeckId,
        front: question?.prompt || 'Questão do Simulado',
        back: `${correctAnswerText || ''}\n\nExplicação: ${question?.generalExplanation || ''}`,
        category: activeQuiz.topic,
        difficulty: 'hard' as const,
        mnemonicHint: question?.keyConcepts?.[0] ? `Foco: ${question.keyConcepts[0]}` : undefined,
      };
    });

    addFlashcards(cardsToCreate);
    soundController.playSuccessChime();
    alert(`${cardsToCreate.length} novos flashcards adicionados ao seu baralho para reforço imediato!`);
    setActiveTab('flashcards');
  };

  // -------------------------------------------------------------
  // RENDER: Active Quiz Session
  // -------------------------------------------------------------
  if (activeQuiz && !isCompleted) {
    const question = activeQuiz.questions[currentQuestionIndex];
    const isAnswered = !!userAnswers[question.id];
    const isFlagged = !!flaggedQuestions[question.id];
    const openEval = openEvaluations[question.id];

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const formattedTimer = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Exam Session Header */}
        <div className="bg-[#111827] border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveQuizId(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded border border-white/10 hover:bg-white/5 transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="text-xs font-mono text-[#6366F1] uppercase tracking-wider">
                {activeQuiz.topic} • Dificuldade {activeQuiz.difficulty}
              </div>
              <h2 className="text-base font-semibold text-white line-clamp-1">{activeQuiz.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Countdown Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0B0F19] border border-white/10 rounded-lg text-slate-200 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>{formattedTimer}</span>
            </div>

            {/* Finish Button */}
            <button
              onClick={handleFinishQuiz}
              className="px-3.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold rounded shadow-md shadow-[#10B981]/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finalizar Simulado</span>
            </button>
          </div>
        </div>

        {/* Question Navigation Rail */}
        <div className="bg-[#111827] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            {activeQuiz.questions.map((q, idx) => {
              const isCurr = idx === currentQuestionIndex;
              const hasAns = !!userAnswers[q.id];
              const flagged = !!flaggedQuestions[q.id];

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded text-xs font-mono font-medium transition-all relative flex items-center justify-center border ${
                    isCurr
                      ? 'bg-[#6366F1] text-white border-[#6366F1] shadow-md shadow-[#6366F1]/30 scale-105'
                      : hasAns
                      ? 'bg-[#1E293B] text-slate-200 border-white/20'
                      : 'bg-[#0B0F19] text-slate-400 border-white/10 hover:border-white/30'
                  }`}
                >
                  <span>{idx + 1}</span>
                  {flagged && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#F59E0B]" />
                  )}
                  {hasAns && !isCurr && (
                    <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              setFlaggedQuestions((prev) => ({ ...prev, [question.id]: !isFlagged }));
            }}
            className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
              isFlagged
                ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                : 'text-slate-400 border-white/10 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flag className="w-3 h-3" />
            <span className="hidden sm:inline font-mono text-[11px]">
              {isFlagged ? 'Marcada para Revisão' : 'Marcar para Revisão'}
            </span>
          </button>
        </div>

        {/* Question Card */}
        <div className="bg-[#1E293B] border border-white/[0.08] rounded-xl p-6 shadow-2xl relative">
          {/* Question Meta */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-[#6366F1] bg-[#6366F1]/10 px-2 py-0.5 rounded border border-[#6366F1]/20">
              Questão {currentQuestionIndex + 1} de {activeQuiz.questions.length} •{' '}
              {question.type === 'multiple_choice' ? 'Múltipla Escolha' : 'Discursiva'}
            </span>

            {question.keyConcepts && question.keyConcepts.length > 0 && (
              <div className="flex items-center gap-1">
                {question.keyConcepts.map((kc, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded"
                  >
                    {kc}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Prompt */}
          <h3 className="text-base md:text-lg font-medium text-white mb-6 leading-relaxed">
            {question.prompt}
          </h3>

          {/* Multiple Choice Options */}
          {question.type === 'multiple_choice' && question.options && (
            <div className="space-y-3">
              {question.options.map((option) => {
                const isSelected = userAnswers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      setUserAnswers((prev) => ({ ...prev, [question.id]: option.id }));
                      soundController.playFlipSound();
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all flex items-start gap-3 group ${
                      isSelected
                        ? 'bg-[#6366F1]/15 border-[#6366F1] text-white shadow-md shadow-[#6366F1]/20'
                        : 'bg-[#111827] border-white/10 text-slate-300 hover:border-white/20 hover:bg-[#111827]/80'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold shrink-0 border ${
                        isSelected
                          ? 'bg-[#6366F1] text-white border-[#6366F1]'
                          : 'bg-[#0B0F19] text-slate-400 border-white/15 group-hover:border-white/30'
                      }`}
                    >
                      {option.id}
                    </span>
                    <span className="text-xs md:text-sm pt-0.5 leading-relaxed">{option.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Open Ended Essay Textarea */}
          {question.type === 'open_ended' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300">
                Escreva sua resposta de forma técnica e completa. Nossa IA analisará sua resposta com base em critérios de rigor, precisão e omissões conceituais.
              </div>
              <textarea
                value={userAnswers[question.id] || ''}
                onChange={(e) =>
                  setUserAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                }
                rows={5}
                placeholder="Digite sua fundamentação conceitual detalhada aqui..."
                className="w-full bg-[#111827] border border-white/15 focus:border-[#6366F1] rounded-lg p-4 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none leading-relaxed"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {userAnswers[question.id]?.length || 0} caracteres digitados
                </span>

                <button
                  onClick={() => handleEvaluateOpenAnswer(question)}
                  disabled={!userAnswers[question.id]?.trim() || evaluatingQuestionId === question.id}
                  className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-semibold rounded flex items-center gap-2 shadow-md shadow-[#8B5CF6]/20 transition-all"
                >
                  {evaluatingQuestionId === question.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analisando com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Corrigir Resposta com IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Open Evaluation Feedback Panel */}
              {openEval && (
                <div className="mt-4 p-4 rounded-lg bg-[#0B0F19] border border-[#8B5CF6]/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Avaliação Diagnóstica IA</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          openEval.score >= 80
                            ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30'
                            : openEval.score >= 60
                            ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30'
                            : 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/30'
                        }`}
                      >
                        Nota: {openEval.score}/100 • {openEval.verdict}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{openEval.generalFeedback}</p>

                  {openEval.strengths && openEval.strengths.length > 0 && (
                    <div className="text-xs space-y-1">
                      <div className="text-[11px] font-mono text-[#10B981] uppercase">Pontos Fortes Identificados:</div>
                      {openEval.strengths.map((s, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {openEval.gapsOrMisconceptions && openEval.gapsOrMisconceptions.length > 0 && (
                    <div className="text-xs space-y-1">
                      <div className="text-[11px] font-mono text-[#F43F5E] uppercase">Lacunas ou Imprecisões:</div>
                      {openEval.gapsOrMisconceptions.map((g, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                          <XCircle className="w-3.5 h-3.5 text-[#F43F5E] shrink-0 mt-0.5" />
                          <span>{g}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {openEval.suggestedReviewFocus && (
                    <div className="text-xs p-2.5 rounded bg-white/5 text-[#C0C1FF] font-mono">
                      💡 Sugestão de Revisão: {openEval.suggestedReviewFocus}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prev / Next controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-[#111827] hover:bg-[#1E293B] disabled:opacity-30 text-slate-300 hover:text-white border border-white/10 rounded text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Questão Anterior</span>
          </button>

          <span className="font-mono text-xs text-slate-400">
            {currentQuestionIndex + 1} de {activeQuiz.questions.length}
          </span>

          {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
              className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <span>Próxima Questão</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinishQuiz}
              className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concluir e Ver Resultado</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Quiz Result & Diagnostic Breakdown
  // -------------------------------------------------------------
  if (activeQuiz && isCompleted && latestSubmission) {
    const wrongAnswers = latestSubmission.answers.filter((a) => !a.isCorrect);

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Performance Score Banner */}
        <div className="bg-gradient-to-br from-[#111827] to-[#1E293B] border border-white/15 rounded-xl p-6 md:p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300 mb-4">
            <Award className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>RELATÓRIO DIAGNÓSTICO DO SIMULADO</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{activeQuiz.title}</h2>
          <p className="text-xs text-slate-400 font-mono mb-6">
            Concluído em {new Date(latestSubmission.completedAt).toLocaleTimeString()} • Tempo:{' '}
            {Math.floor(latestSubmission.timeSpentSeconds / 60)}m {latestSubmission.timeSpentSeconds % 60}s
          </p>

          <div className="flex items-center justify-center gap-8 mb-6">
            <div>
              <div className="text-4xl md:text-5xl font-extrabold font-mono text-white">
                {latestSubmission.score}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Pontuação Final</div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div>
              <div className="text-4xl md:text-5xl font-extrabold font-mono text-[#10B981]">
                {latestSubmission.correctCount}/{latestSubmission.totalQuestions}
              </div>
              <div className="text-xs text-slate-400 mt-1">Acertos</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {wrongAnswers.length > 0 && (
              <button
                onClick={handleCreateCardsFromMistakes}
                className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold rounded flex items-center gap-2 shadow-lg shadow-[#8B5CF6]/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Converter Erros em Flashcards ({wrongAnswers.length})</span>
              </button>
            )}

            <button
              onClick={() => handleStartQuiz(activeQuiz)}
              className="px-4 py-2 bg-[#1E293B] hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 rounded flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refazer Simulado</span>
            </button>

            <button
              onClick={() => setActiveQuizId(null)}
              className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-medium rounded transition-all"
            >
              Voltar ao Acervo de Simulados
            </button>
          </div>
        </div>

        {/* Detailed Question by Question Diagnostic Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Gabarito Comentado e Análise de Distratores</h3>
            <span className="text-xs font-mono text-slate-400">
              {latestSubmission.correctCount} acertos • {wrongAnswers.length} erros
            </span>
          </div>

          {activeQuiz.questions.map((q, idx) => {
            const answerRecord = latestSubmission.answers.find((a) => a.questionId === q.id);
            const isCorrect = answerRecord?.isCorrect;

            return (
              <div
                key={q.id}
                className={`bg-[#1E293B] border rounded-xl p-5 shadow-lg space-y-4 transition-all ${
                  isCorrect ? 'border-[#10B981]/30' : 'border-[#F43F5E]/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold ${
                        isCorrect ? 'bg-[#10B981] text-white' : 'bg-[#F43F5E] text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {q.type === 'multiple_choice' ? 'Múltipla Escolha' : 'Discursiva'}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded-full border ${
                      isCorrect
                        ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                        : 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30'
                    }`}
                  >
                    {isCorrect ? 'Correta' : 'Incorreta'}
                  </span>
                </div>

                <p className="text-sm font-medium text-white leading-relaxed">{q.prompt}</p>

                {/* Multiple choice review */}
                {q.type === 'multiple_choice' && q.options && (
                  <div className="space-y-2 pt-2">
                    {q.options.map((opt) => {
                      const wasSelected = answerRecord?.selectedOptionId === opt.id;
                      const isOptionCorrect = opt.isCorrect;

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-lg border text-xs space-y-1 ${
                            isOptionCorrect
                              ? 'bg-[#10B981]/10 border-[#10B981]/40 text-slate-200'
                              : wasSelected
                              ? 'bg-[#F43F5E]/10 border-[#F43F5E]/40 text-slate-200'
                              : 'bg-[#111827] border-white/5 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-2">
                              <span className="font-mono">{opt.id})</span>
                              <span>{opt.text}</span>
                            </span>
                            {isOptionCorrect && (
                              <span className="text-[10px] font-mono text-[#10B981] uppercase">Gabarito</span>
                            )}
                            {wasSelected && !isOptionCorrect && (
                              <span className="text-[10px] font-mono text-[#F43F5E] uppercase">Sua Escolha</span>
                            )}
                          </div>
                          {opt.explanation && (
                            <div className="text-[11px] text-slate-400 pl-4 border-l border-white/10">
                              {opt.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Open ended review */}
                {q.type === 'open_ended' && (
                  <div className="space-y-3 pt-2 text-xs">
                    <div className="p-3 bg-[#111827] border border-white/10 rounded-lg">
                      <div className="font-mono text-[11px] text-slate-400 mb-1">SUA RESPOSTA:</div>
                      <p className="text-slate-200">{answerRecord?.studentTextAnswer || 'Não respondida'}</p>
                    </div>

                    {q.sampleModelAnswer && (
                      <div className="p-3 bg-[#10B981]/5 border border-[#10B981]/20 rounded-lg">
                        <div className="font-mono text-[11px] text-[#10B981] mb-1">RESPOSTA MODELO:</div>
                        <p className="text-slate-300">{q.sampleModelAnswer}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* General pedagogical explanation */}
                {q.generalExplanation && (
                  <div className="p-3 bg-[#0B0F19] border border-white/5 rounded-lg text-xs text-slate-300">
                    <span className="font-mono text-[11px] text-[#6366F1] font-semibold block mb-1">
                      FUNDAMENTAÇÃO COGNITIVA:
                    </span>
                    {q.generalExplanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Quiz Catalog / Hub
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <BrainCircuit className="w-6 h-6 text-[#6366F1]" />
            <span>Central de Simulados Diagnósticos</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Simulações cronometradas com análise exaustiva de distratores e correção discursiva por IA.
          </p>
        </div>

        <button
          onClick={onOpenCreateQuizModal}
          className="px-4 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#6366F1]/25 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Simulado com IA</span>
        </button>
      </div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {quizzes.map((quiz) => {
          const hasCompleted = !!quiz.completedAt;
          return (
            <div
              key={quiz.id}
              className="bg-[#1E293B] border border-white/[0.08] hover:border-[#6366F1]/50 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#6366F1]/15 text-[#C0C1FF] border border-[#6366F1]/20">
                    {quiz.topic}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Dificuldade: {quiz.difficulty}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-[#C0C1FF] transition-colors line-clamp-2">
                  {quiz.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-mono mb-4">
                  <div className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{quiz.questions.length} questões</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{quiz.timeLimitMinutes || 10} min</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  {hasCompleted ? (
                    <div className="text-xs font-mono text-[#10B981] flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>Melhor: {quiz.bestScore}%</span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400">Pendente</span>
                  )}
                </div>

                <button
                  onClick={() => handleStartQuiz(quiz)}
                  className="px-3.5 py-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>{hasCompleted ? 'Refazer' : 'Iniciar'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
