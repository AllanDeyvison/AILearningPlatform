import React, { useState } from 'react';
import { Sparkles, X, BrainCircuit, Loader2, BookOpen, Sliders } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { soundController } from '../../utils/soundscapes';

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateQuizModal: React.FC<CreateQuizModalProps> = ({ isOpen, onClose }) => {
  const { addQuiz, setActiveQuizId, setActiveTab } = useStudy();

  const [topic, setTopic] = useState('');
  const [sourceContent, setSourceContent] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'iniciante' | 'intermediario' | 'avancado'>('intermediario');
  const [questionType, setQuestionType] = useState<'mixed' | 'multiple_choice' | 'open_ended'>('mixed');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !sourceContent.trim()) {
      setError('Por favor, digite um assunto ou cole um texto de referência.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || 'Simulado Personalizado',
          sourceContent: sourceContent.trim(),
          questionCount,
          difficulty,
          questionType,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${res.status} ao gerar simulado.`);
      }

      const data = await res.json();
      if (!data.quiz || !data.quiz.questions) {
        throw new Error('Formato inválido retornado pela IA.');
      }

      const createdQuiz = addQuiz({
        title: data.quiz.title || `Simulado: ${topic}`,
        topic: data.quiz.topic || topic || 'Geral',
        difficulty: data.quiz.difficulty || difficulty,
        questionCount: data.quiz.questions.length,
        timeLimitMinutes: Math.max(5, Math.round(data.quiz.questions.length * 2.5)),
        questions: data.quiz.questions,
      });

      soundController.playSuccessChime();
      setActiveQuizId(createdQuiz.id);
      setActiveTab('quizzes');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao conectar com o motor de IA do Cognitio Studio.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-xl bg-[#1E293B] border border-[#6366F1]/30 rounded-xl shadow-2xl p-6 relative ai-glow animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-[#6366F1]">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Criar Simulado Inteligente</h2>
            <p className="text-xs text-slate-400">Geração de questões avaliativas com Gemini 2.5</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#F43F5E]/15 border border-[#F43F5E]/30 text-xs text-[#F43F5E]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
              Assunto ou Matéria Principal
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Farmacologia Cardiovascular, Redes Neurais Convolucionais..."
              className="w-full bg-[#111827] border border-white/10 focus:border-[#6366F1] rounded-lg px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
              Texto / Notas de Referência (Opcional)
            </label>
            <textarea
              value={sourceContent}
              onChange={(e) => setSourceContent(e.target.value)}
              rows={3}
              placeholder="Cole anotações de aula, artigo científico ou trecho de livro..."
              className="w-full bg-[#111827] border border-white/10 focus:border-[#6366F1] rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Questões</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full bg-[#111827] border border-white/10 text-xs rounded-lg p-2 text-white focus:outline-none"
              >
                <option value={3}>3 questões</option>
                <option value={5}>5 questões</option>
                <option value={8}>8 questões</option>
                <option value={10}>10 questões</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Dificuldade</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-[#111827] border border-white/10 text-xs rounded-lg p-2 text-white focus:outline-none"
              >
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Tipo de Questão</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as any)}
                className="w-full bg-[#111827] border border-white/10 text-xs rounded-lg p-2 text-white focus:outline-none"
              >
                <option value="mixed">Misto (Múltipla + Discursiva)</option>
                <option value="multiple_choice">Múltipla Escolha</option>
                <option value="open_ended">Discursiva (Texto livre)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs text-slate-300 hover:text-white rounded border border-white/10 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-[#6366F1]/30 flex items-center gap-2 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando Simulado IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Simulado</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
