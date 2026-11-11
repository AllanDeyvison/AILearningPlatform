import React, { useEffect, useState } from 'react';
import {
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  BrainCircuit,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Layers,
  BookOpen,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { soundController } from '../../utils/soundscapes';

export const ReviewDiagnosticsView: React.FC = () => {
  const {
    stats,
    decks,
    quizzes,
    submissions,
    recommendations,
    refreshRecommendations,
    isLoadingRecommendations,
    addQuiz,
    setActiveQuizId,
    setActiveTab,
  } = useStudy();

  const [isGeneratingReinforceQuiz, setIsGeneratingReinforceQuiz] = useState(false);

  // Load recommendations on mount if not loaded
  useEffect(() => {
    if (!recommendations) {
      refreshRecommendations();
    }
  }, []);

  // Generate an immediate reinforcement quiz based on weakest topics
  const handleGenerateReinforceQuiz = async () => {
    const weakList = Object.entries(stats.accuracyByTopic)
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .map(([topic]) => topic);

    const primaryWeakTopic = weakList[0] || 'Conceitos com Baixa Retenção';

    setIsGeneratingReinforceQuiz(true);
    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: primaryWeakTopic,
          sourceContent: `Foco exclusivo nos pontos fracos e erros recorrentes do aluno em: ${primaryWeakTopic}. Crie questões de alta densidade diagnóstica.`,
          questionCount: 4,
          difficulty: 'intermediario',
          questionType: 'mixed',
        }),
      });

      if (!res.ok) throw new Error('Falha ao gerar simulado.');
      const data = await res.json();

      if (data.quiz) {
        const created = addQuiz({
          title: `Simulado de Reforço: ${primaryWeakTopic}`,
          topic: primaryWeakTopic,
          difficulty: 'intermediario',
          questionCount: data.quiz.questions.length,
          timeLimitMinutes: 8,
          questions: data.quiz.questions,
        });

        soundController.playSuccessChime();
        setActiveQuizId(created.id);
        setActiveTab('quizzes');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar simulado de reforço. Tente novamente.');
    } finally {
      setIsGeneratingReinforceQuiz(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <Target className="w-6 h-6 text-[#F59E0B]" />
            <span>Trilha de Revisão & Diagnóstico Cognitivo</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Recomendações algorítmicas de repetição espaçada e análise preditiva de retenção.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refreshRecommendations()}
            disabled={isLoadingRecommendations}
            className="px-3.5 py-2 bg-[#1E293B] hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecommendations ? 'animate-spin' : ''}`} />
            <span>Atualizar Diagnóstico</span>
          </button>

          <button
            onClick={handleGenerateReinforceQuiz}
            disabled={isGeneratingReinforceQuiz}
            className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#F59E0B]/20 transition-all flex items-center gap-2"
          >
            {isGeneratingReinforceQuiz ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BrainCircuit className="w-4 h-4" />
            )}
            <span>Gerar Simulado de Reforço IA</span>
          </button>
        </div>
      </div>

      {/* AI Diagnostic Summary Card */}
      <div className="bg-[#1E293B] border border-white/10 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#D0BCFF] text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PARECER COGNITIVO DO MOTOR IA</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-white">
              {recommendations?.diagnosticSummary ||
                'Seu ritmo de estudos está consistente. Priorize hoje os tópicos com menor taxa de acerto nos simulados recentes.'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {recommendations?.motivationalCognitiveTip ||
                'Princípio da Prática Intercalada: Alternar matérias diferentes na mesma sessão aumenta a retenção em 40% em relação ao estudo em bloco único.'}
            </p>
          </div>

          {/* Retention Gauge Badge */}
          <div className="bg-[#111827] border border-white/10 rounded-xl p-4 text-center shrink-0 min-w-[160px]">
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Taxa de Retenção Estimada
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#10B981] mt-1">
              {recommendations?.retentionScoreEstimate || stats.averageAccuracyRate}%
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">Nível de Memória Ativa</div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Weak Topics + Today's Priority Action Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Weakest Topics Breakdown */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F43F5E]" />
              <h3 className="text-sm font-semibold text-white">Pontos Fracos Prioritários</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Necessitam de re-exposição</span>
          </div>

          <div className="space-y-3">
            {recommendations?.weakestTopics && recommendations.weakestTopics.length > 0 ? (
              recommendations.weakestTopics.map((wt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-[#1E293B] border border-[#F43F5E]/20 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{wt.topic}</span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                        wt.urgency === 'alta'
                          ? 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/40'
                          : 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                      }`}
                    >
                      Urgência {wt.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{wt.reason}</p>
                  <div className="text-[11px] font-mono text-[#C0C1FF] pt-1">
                    → Ação recomendada: {wt.recommendedAction}
                  </div>
                </div>
              ))
            ) : (
              /* Fallback from stats */
              Object.entries(stats.accuracyByTopic)
                .sort((a, b) => a[1].percentage - b[1].percentage)
                .slice(0, 3)
                .map(([topic, data], idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-[#1E293B] border border-white/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{topic}</span>
                      <span className="text-xs font-mono text-[#F43F5E] font-semibold">
                        {data.percentage}% de acerto
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Erros detectados em {data.total - data.correct} questões recentes. Recomendamos realizar 5 flashcards ou um simulado focado.
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Right: Today's Action Plan */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#6366F1]" />
              <h3 className="text-sm font-semibold text-white">Cronograma Sugerido para Hoje</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Tempo estimado: ~45 min</span>
          </div>

          <div className="space-y-3">
            {(
              recommendations?.todayActionPlan || [
                {
                  task: 'Revisar baralho de Engenharia de Software (4 cards devidos)',
                  timeMinutes: 10,
                  type: 'flashcards',
                },
                {
                  task: 'Fazer simulado curto de Fisiologia Cardiorrespiratória',
                  timeMinutes: 15,
                  type: 'simulado',
                },
                {
                  task: 'Ler resumo comparativo sobre Teorema CAP & PACELC',
                  timeMinutes: 10,
                  type: 'resumo',
                },
                {
                  task: 'Tirar dúvidas de controle de constitucionalidade com Tutor Socrático',
                  timeMinutes: 10,
                  type: 'tutor',
                },
              ]
            ).map((plan, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-[#1E293B] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#6366F1]/20 text-[#C0C1FF] flex items-center justify-center font-mono text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{plan.task}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Estimado: {plan.timeMinutes} minutos • Tipo: {plan.type}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (plan.type === 'simulado') setActiveTab('quizzes');
                    else if (plan.type === 'flashcards') setActiveTab('flashcards');
                    else if (plan.type === 'resumo') setActiveTab('materials');
                    else setActiveTab('tutor');
                  }}
                  className="px-2.5 py-1 text-xs text-[#6366F1] hover:text-white hover:bg-[#6366F1] rounded border border-[#6366F1]/30 transition-all font-mono shrink-0"
                >
                  Iniciar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
