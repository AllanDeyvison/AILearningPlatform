import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  Bookmark,
  Share2,
  Trash2,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Layers,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { StudyMaterial } from '../../types';
import { soundController } from '../../utils/soundscapes';

interface StudyLabViewProps {
  onOpenCreateMaterialModal: () => void;
}

export const StudyLabView: React.FC<StudyLabViewProps> = ({ onOpenCreateMaterialModal }) => {
  const {
    materials,
    toggleBookmarkMaterial,
    deleteMaterial,
    activeMaterialId,
    setActiveMaterialId,
    addFlashcards,
    createDeck,
    addQuiz,
    setActiveTab,
    setActiveQuizId,
  } = useStudy();

  const [expandedKeyPoint, setExpandedKeyPoint] = useState<number | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [isConvertingToCards, setIsConvertingToCards] = useState(false);
  const [isConvertingToQuiz, setIsConvertingToQuiz] = useState(false);

  const activeMaterial = materials.find((m) => m.id === activeMaterialId);

  // Convert current material to flashcards with AI
  const handleConvertToFlashcards = async (material: StudyMaterial) => {
    setIsConvertingToCards(true);
    try {
      const res = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: material.topic,
          sourceText: `${material.overview}\n\n${material.keyPoints.map((k) => `${k.title}: ${k.explanation}`).join('\n')}`,
          count: 8,
        }),
      });

      if (!res.ok) throw new Error('Falha na geração de flashcards.');
      const data = await res.json();

      if (data.deck?.cards) {
        const newDeck = createDeck(
          data.deck.deckTitle || `Flashcards: ${material.topic}`,
          `Baralho gerado a partir do material "${material.title}"`,
          material.topic,
          '#6366F1'
        );

        const formattedCards = data.deck.cards.map((c: any) => ({
          deckId: newDeck.id,
          front: c.front,
          back: c.back,
          category: c.category || material.topic,
          difficulty: c.difficulty || 'medium',
          mnemonicHint: c.mnemonicHint,
        }));

        addFlashcards(formattedCards);
        soundController.playSuccessChime();
        alert(`Sucesso! Baralho "${newDeck.title}" criado com ${formattedCards.length} flashcards.`);
        setActiveTab('flashcards');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao converter material em flashcards. Tente novamente.');
    } finally {
      setIsConvertingToCards(false);
    }
  };

  // Convert current material to quiz with AI
  const handleConvertToQuiz = async (material: StudyMaterial) => {
    setIsConvertingToQuiz(true);
    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: material.topic,
          sourceContent: `${material.overview}\n\n${material.keyPoints.map((k) => `${k.title}: ${k.explanation}`).join('\n')}`,
          questionCount: 4,
          difficulty: 'intermediario',
        }),
      });

      if (!res.ok) throw new Error('Falha na geração de simulado.');
      const data = await res.json();

      if (data.quiz) {
        const newQuiz = addQuiz({
          title: data.quiz.title || `Simulado: ${material.topic}`,
          topic: material.topic,
          difficulty: data.quiz.difficulty || 'intermediario',
          questionCount: data.quiz.questions.length,
          timeLimitMinutes: 10,
          questions: data.quiz.questions,
        });

        soundController.playSuccessChime();
        setActiveQuizId(newQuiz.id);
        setActiveTab('quizzes');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar simulado. Tente novamente.');
    } finally {
      setIsConvertingToQuiz(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER: Full Document Reader Mode
  // -------------------------------------------------------------
  if (activeMaterial) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Reader Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111827] border border-white/10 rounded-xl p-4 shadow-xl">
          <button
            onClick={() => setActiveMaterialId(null)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Acervo</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Convert to Flashcards */}
            <button
              onClick={() => handleConvertToFlashcards(activeMaterial)}
              disabled={isConvertingToCards}
              className="px-3 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-medium rounded flex items-center gap-1.5 shadow-md shadow-[#8B5CF6]/20 transition-all"
            >
              {isConvertingToCards ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Layers className="w-3.5 h-3.5" />
              )}
              <span>Gerar Flashcards</span>
            </button>

            {/* Convert to Quiz */}
            <button
              onClick={() => handleConvertToQuiz(activeMaterial)}
              disabled={isConvertingToQuiz}
              className="px-3 py-1.5 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white text-xs font-medium rounded flex items-center gap-1.5 shadow-md shadow-[#6366F1]/20 transition-all"
            >
              {isConvertingToQuiz ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BrainCircuit className="w-3.5 h-3.5" />
              )}
              <span>Gerar Simulado</span>
            </button>

            {/* Bookmark button */}
            <button
              onClick={() => toggleBookmarkMaterial(activeMaterial.id)}
              className={`p-1.5 rounded border transition-colors ${
                activeMaterial.isBookmarked
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Material Paper Container */}
        <article className="bg-[#1E293B] border border-white/[0.08] rounded-xl p-6 md:p-10 shadow-2xl space-y-8">
          {/* Header */}
          <div className="space-y-3 border-b border-white/10 pb-6">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                {activeMaterial.topic}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Criado em {new Date(activeMaterial.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
              {activeMaterial.title}
            </h1>
          </div>

          {/* Executive Overview */}
          <section className="space-y-2">
            <h2 className="text-xs font-mono uppercase text-[#C0C1FF] tracking-wider font-semibold">
              01. RESUMO EXECUTIVO
            </h2>
            <div className="p-4 rounded-lg bg-[#111827] border border-white/5 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {activeMaterial.overview}
            </div>
          </section>

          {/* Key Points */}
          <section className="space-y-3">
            <h2 className="text-xs font-mono uppercase text-[#C0C1FF] tracking-wider font-semibold">
              02. PILARES & CONCEITOS ESSENCIAIS
            </h2>
            <div className="space-y-2.5">
              {activeMaterial.keyPoints.map((kp, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-[#111827] border border-white/5 p-4 hover:border-white/15 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#6366F1]/20 text-[#C0C1FF] flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-white">{kp.title}</h3>
                      <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                        {kp.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Comparison Table (if exists) */}
          {activeMaterial.comparisonTable && activeMaterial.comparisonTable.headers && (
            <section className="space-y-3">
              <h2 className="text-xs font-mono uppercase text-[#C0C1FF] tracking-wider font-semibold">
                03. TABELA COMPARATIVA DIAGNÓSTICA
              </h2>
              <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#111827]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0F19] text-slate-300 font-mono border-b border-white/10">
                    <tr>
                      {activeMaterial.comparisonTable.headers.map((h, i) => (
                        <th key={i} className="p-3 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {activeMaterial.comparisonTable.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-3 leading-relaxed">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Mnemonics & Analogies */}
          {activeMaterial.mnemonics && activeMaterial.mnemonics.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-mono uppercase text-[#F59E0B] tracking-wider font-semibold flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
                <span>04. MNEMÔNICOS & MODELOS MENTAIS PARA FIXAÇÃO</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeMaterial.mnemonics.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed"
                  >
                    {m}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Practical Application */}
          {activeMaterial.practicalApplication && (
            <section className="space-y-2">
              <h2 className="text-xs font-mono uppercase text-[#10B981] tracking-wider font-semibold">
                05. CASO PRÁTICO & APLICAÇÃO REAL
              </h2>
              <div className="p-4 rounded-lg bg-[#10B981]/10 border border-[#10B981]/25 text-slate-200 text-xs md:text-sm leading-relaxed">
                {activeMaterial.practicalApplication}
              </div>
            </section>
          )}

          {/* Fixation Questions */}
          {activeMaterial.fixationQuestions && activeMaterial.fixationQuestions.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-mono uppercase text-[#C0C1FF] tracking-wider font-semibold">
                06. PERGUNTAS RÁPIDAS DE FIXAÇÃO
              </h2>
              <div className="space-y-2">
                {activeMaterial.fixationQuestions.map((q, idx) => {
                  const isRevealed = !!revealedAnswers[idx];
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-[#111827] border border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-white">
                        <span>{q.question}</span>
                        <button
                          onClick={() =>
                            setRevealedAnswers((prev) => ({ ...prev, [idx]: !isRevealed }))
                          }
                          className="text-[11px] font-mono text-[#6366F1] hover:underline shrink-0 ml-3"
                        >
                          {isRevealed ? 'Ocultar Resposta' : 'Revelar Resposta'}
                        </button>
                      </div>
                      {isRevealed && (
                        <div className="p-2.5 rounded bg-[#0B0F19] text-xs text-slate-300 border border-white/5 animate-in fade-in">
                          {q.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Next Recommended Topics */}
          {activeMaterial.nextStudyTopics && activeMaterial.nextStudyTopics.length > 0 && (
            <section className="space-y-2 border-t border-white/10 pt-6">
              <div className="text-[11px] font-mono uppercase text-slate-400">
                Próximos Passos Recomendados:
              </div>
              <div className="flex flex-wrap gap-2">
                {activeMaterial.nextStudyTopics.map((top, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono px-3 py-1 rounded bg-white/5 border border-white/10 text-slate-300"
                  >
                    → {top}
                  </span>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Catalog of Materials
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#10B981]" />
            <span>Study Lab: Materiais Estruturados</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Resumos com alta densidade de informação, tabelas comparativas, mnemônicos e conversão direta para simulados.
          </p>
        </div>

        <button
          onClick={onOpenCreateMaterialModal}
          className="px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#10B981]/25 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Gerar Material com IA</span>
        </button>
      </div>

      {/* Grid of Materials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {materials.map((mat) => (
          <div
            key={mat.id}
            className="bg-[#1E293B] border border-white/[0.08] hover:border-[#10B981]/50 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20">
                  {mat.topic}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleBookmarkMaterial(mat.id)}
                    className={`p-1 rounded ${
                      mat.isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir material "${mat.title}"?`)) {
                        deleteMaterial(mat.id);
                      }
                    }}
                    className="p-1 text-slate-500 hover:text-[#F43F5E] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-semibold text-white mb-2 group-hover:text-[#10B981] transition-colors line-clamp-2">
                {mat.title}
              </h3>
              <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                {mat.overview}
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                {mat.keyPoints.length} pilares conceituais
              </span>

              <button
                onClick={() => setActiveMaterialId(mat.id)}
                className="px-3.5 py-1.5 bg-[#111827] hover:bg-[#10B981] text-slate-200 hover:text-white border border-white/10 hover:border-transparent text-xs font-medium rounded transition-all"
              >
                Abrir Guia
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
