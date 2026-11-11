import React, { useState } from 'react';
import {
  Flame,
  Target,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  BookOpen,
  MessageSquareCode,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface DashboardViewProps {
  onOpenQuickQuiz: () => void;
  onOpenQuickFlashcards: () => void;
  onOpenQuickMaterial: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenQuickQuiz,
  onOpenQuickFlashcards,
  onOpenQuickMaterial,
}) => {
  const {
    stats,
    decks,
    quizzes,
    submissions,
    getDueCards,
    setActiveTab,
    setActiveDeckId,
    setActiveQuizId,
    sendTutorMessage,
  } = useStudy();

  const [quickPrompt, setQuickPrompt] = useState('');

  const totalDue = getDueCards().length;
  const hoursStudied = (stats.totalStudyMinutes / 60).toFixed(1);

  // Identify weak areas (< 70% accuracy)
  const weakAreas = Object.entries(stats.accuracyByTopic).filter(
    ([_, data]) => data.percentage < 75
  );

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    sendTutorMessage(`Olá! Gostaria de entender e dominar o seguinte tema: ${quickPrompt}`);
    setActiveTab('tutor');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Welcome & AI Command Bar */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#111827] border border-white/10 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#6366F1]/15 border border-[#6366F1]/30 text-[#C0C1FF] text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>ESTÚDIO COGNITIVO COM INTELIGÊNCIA ARTIFICIAL</span>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-white mb-2">
            Acelere sua retenção com aprendizagem ativa.
          </h1>
          <p className="text-sm md:text-base text-slate-300 mb-6 leading-relaxed">
            Gere simulados diagnósticos, resumos estruturados e flashcards espaçados em segundos com auxílio do Gemini 2.5.
          </p>

          {/* Quick AI Prompt Bar */}
          <form onSubmit={handleQuickSubmit} className="relative">
            <div className="flex items-center bg-[#0B0F19] border border-white/15 focus-within:border-[#6366F1] rounded-lg shadow-inner overflow-hidden transition-all">
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="Ex: Explique o algoritmo de Paxos, crie simulado de Direito Tributário..."
                className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="m-1.5 px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-medium rounded flex items-center gap-1.5 shadow-md shadow-[#6366F1]/30 transition-all shrink-0"
              >
                <span>Consultar IA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-[#1E293B] border border-white/[0.08] rounded-lg p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Ofensiva Atual</div>
            <div className="text-2xl font-bold font-mono text-white mt-1 flex items-baseline gap-1">
              {stats.streakDays} <span className="text-xs text-slate-400 font-sans">dias</span>
            </div>
            <div className="text-[11px] text-[#10B981] flex items-center gap-1 mt-1 font-mono">
              <TrendingUp className="w-3 h-3" /> Meta diária ativa
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
            <Flame className="w-5 h-5 fill-[#F59E0B]" />
          </div>
        </div>

        {/* Global Accuracy */}
        <div className="bg-[#1E293B] border border-white/[0.08] rounded-lg p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Precisão Média</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {stats.averageAccuracyRate}%
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              {stats.totalQuizzesTaken} simulados concluídos
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981]">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Due Flashcards */}
        <div className="bg-[#1E293B] border border-white/[0.08] rounded-lg p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Cards Devidos Hoje</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {totalDue}
            </div>
            <div className="text-[11px] text-[#C0C1FF] font-mono mt-1">
              Repetição Espaçada SM-2
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Focus Time */}
        <div className="bg-[#1E293B] border border-white/[0.08] rounded-lg p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Tempo Total Focado</div>
            <div className="text-2xl font-bold font-mono text-white mt-1 flex items-baseline gap-1">
              {hoursStudied} <span className="text-xs text-slate-400 font-sans">horas</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              {stats.totalCardsReviewed} revisões ativas
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Weak Areas Diagnostic Alert (if any) */}
      {weakAreas.length > 0 && (
        <div className="bg-[#F43F5E]/10 border border-[#F43F5E]/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#F43F5E]/20 text-[#F43F5E] shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">
                Ponto de Atenção Diagnóstica Identificado
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Sua taxa de acerto em <span className="text-[#F43F5E] font-medium">{weakAreas[0][0]}</span> está em{' '}
                <span className="font-mono font-semibold">{weakAreas[0][1].percentage}%</span>. Recomendamos um ciclo
                de reforço imediato.
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('review');
            }}
            className="px-3 py-1.5 bg-[#F43F5E] hover:bg-[#E11D48] text-white text-xs font-medium rounded transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>Ver Trilha de Reforço</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Fast Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Simulado IA */}
        <div
          onClick={onOpenQuickQuiz}
          className="group cursor-pointer bg-[#111827] hover:bg-[#1E293B] border border-white/[0.08] hover:border-[#6366F1]/50 rounded-xl p-5 transition-all shadow-md hover:shadow-xl relative overflow-hidden"
        >
          <div className="w-9 h-9 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1] mb-3 group-hover:scale-110 transition-transform">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center justify-between">
            Simulados IA
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#6366F1] group-hover:translate-x-1 transition-all" />
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gere provas de múltipla escolha ou questões discursivas corrigidas por IA.
          </p>
        </div>

        {/* Card 2: Flashcards SRS */}
        <div
          onClick={() => {
            setActiveTab('flashcards');
          }}
          className="group cursor-pointer bg-[#111827] hover:bg-[#1E293B] border border-white/[0.08] hover:border-[#8B5CF6]/50 rounded-xl p-5 transition-all shadow-md hover:shadow-xl relative overflow-hidden"
        >
          <div className="w-9 h-9 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] mb-3 group-hover:scale-110 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center justify-between">
            Flashcards SRS
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#8B5CF6] group-hover:translate-x-1 transition-all" />
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Evocação ativa com algoritmo SM-2 e cartões em 3D para retenção definitiva.
          </p>
        </div>

        {/* Card 3: Study Lab */}
        <div
          onClick={onOpenQuickMaterial}
          className="group cursor-pointer bg-[#111827] hover:bg-[#1E293B] border border-white/[0.08] hover:border-[#10B981]/50 rounded-xl p-5 transition-all shadow-md hover:shadow-xl relative overflow-hidden"
        >
          <div className="w-9 h-9 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981] mb-3 group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center justify-between">
            Materiais de Estudo
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Resumos com tabelas comparativas, mnemônicos e pontos de fixação rápida.
          </p>
        </div>

        {/* Card 4: Tutor */}
        <div
          onClick={() => {
            setActiveTab('tutor');
          }}
          className="group cursor-pointer bg-[#111827] hover:bg-[#1E293B] border border-white/[0.08] hover:border-[#F59E0B]/50 rounded-xl p-5 transition-all shadow-md hover:shadow-xl relative overflow-hidden"
        >
          <div className="w-9 h-9 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] mb-3 group-hover:scale-110 transition-transform">
            <MessageSquareCode className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center justify-between">
            Tutor Cognitivo
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#F59E0B] group-hover:translate-x-1 transition-all" />
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tire dúvidas com método Feynman, diálogos socráticos ou rigor acadêmico.
          </p>
        </div>
      </div>

      {/* Main Split Section: Decks Due + Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Decks requiring review */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Baralhos Devidos Hoje</h2>
              <p className="text-xs text-slate-400 font-mono">Curva de esquecimento de Ebbinghaus</p>
            </div>
            <button
              onClick={onOpenQuickFlashcards}
              className="text-xs text-[#6366F1] hover:underline font-mono"
            >
              + Gerar com IA
            </button>
          </div>

          <div className="space-y-3">
            {decks.map((deck) => {
              const dueInDeck = getDueCards(deck.id).length;
              return (
                <div
                  key={deck.id}
                  className="bg-[#1E293B] border border-white/5 hover:border-white/15 rounded-lg p-3.5 flex items-center justify-between transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: deck.color }} />
                      <span className="text-xs font-semibold text-white">{deck.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{deck.description}</div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right">
                      <span
                        className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          dueInDeck > 0
                            ? 'bg-[#6366F1]/15 text-[#C0C1FF] border-[#6366F1]/30'
                            : 'bg-white/5 text-slate-400 border-white/10'
                        }`}
                      >
                        {dueInDeck} devidos
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setActiveDeckId(deck.id);
                        setActiveTab('flashcards');
                      }}
                      className="px-3 py-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-medium rounded transition-colors"
                    >
                      Praticar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Accuracy by Subject & Latest Quizzes */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Retenção por Matéria</h2>
                <p className="text-xs text-slate-400 font-mono">Desempenho acumulado nos simulados</p>
              </div>
              <button
                onClick={() => setActiveTab('review')}
                className="text-xs text-[#6366F1] hover:underline font-mono"
              >
                Ver Análise Completa
              </button>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4 mb-6">
              {Object.entries(stats.accuracyByTopic).map(([topic, data]) => (
                <div key={topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">{topic}</span>
                    <span className="font-mono text-slate-300">
                      {data.percentage}% ({data.correct}/{data.total} questões)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#0B0F19] rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        data.percentage >= 80
                          ? 'bg-[#10B981]'
                          : data.percentage >= 65
                          ? 'bg-[#6366F1]'
                          : 'bg-[#F43F5E]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, data.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Quiz launcher banner */}
          <div className="bg-[#1E293B] border border-white/10 rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Quer testar seu conhecimento agora?</div>
              <div className="text-[11px] text-slate-400 font-mono">
                {quizzes.length} simulados disponíveis no acervo
              </div>
            </div>
            <button
              onClick={() => setActiveTab('quizzes')}
              className="px-3 py-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-medium rounded transition-colors"
            >
              Ir para Simulados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
