import React, { useState } from 'react';
import { Sparkles, X, BookOpen, Loader2 } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { soundController } from '../../utils/soundscapes';

interface CreateMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateMaterialModal: React.FC<CreateMaterialModalProps> = ({ isOpen, onClose }) => {
  const { addMaterial, setActiveMaterialId, setActiveTab } = useStudy();

  const [topic, setTopic] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [depth, setDepth] = useState<'essencial' | 'detalhado' | 'profundo'>('detalhado');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Por favor, digite o tópico para o material de estudo.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          focusArea: focusArea.trim() || 'geral',
          depth,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${res.status} ao produzir material.`);
      }

      const data = await res.json();
      if (!data.material) {
        throw new Error('Falha ao processar material estruturado.');
      }

      const mat = data.material;
      const created = addMaterial({
        title: mat.title || `Guia de Estudos: ${topic}`,
        topic: mat.topic || topic,
        overview: mat.overview || 'Resumo do tema.',
        keyPoints: mat.keyPoints || [],
        mnemonics: mat.mnemonics || [],
        comparisonTable: mat.comparisonTable,
        fixationQuestions: mat.fixationQuestions,
        practicalApplication: mat.practicalApplication,
        nextStudyTopics: mat.nextStudyTopics || [],
      });

      soundController.playSuccessChime();
      setActiveMaterialId(created.id);
      setActiveTab('materials');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao gerar material com IA.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-xl bg-[#1E293B] border border-[#10B981]/30 rounded-xl shadow-2xl p-6 relative ai-glow animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Gerar Material de Estudo com IA</h2>
            <p className="text-xs text-slate-400">Resumo executivo, mnemônicos e tabelas comparativas</p>
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
              Tema ou Matéria do Guia
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Teoria Geral dos Contratos, Fotossíntese e Ciclo de Calvin, Algoritmo A*..."
              className="w-full bg-[#111827] border border-white/10 focus:border-[#10B981] rounded-lg px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
              Foco Específico ou Objetivo (Opcional)
            </label>
            <input
              type="text"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              placeholder="Ex: Preparação para prova de residência, entrevista técnica de system design..."
              className="w-full bg-[#111827] border border-white/10 focus:border-[#10B981] rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              Profundidade Conceitual
            </label>
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value as any)}
              className="w-full bg-[#111827] border border-white/10 text-xs rounded-lg p-2.5 text-white focus:outline-none"
            >
              <option value="essencial">Essencial & Sintético (Rápida memorização)</option>
              <option value="detalhado">Detalhado & Equilibrado (Padrão ouro)</option>
              <option value="profundo">Aprofundado & Rigoroso (Pós-graduação e Concursos)</option>
            </select>
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
              className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-[#10B981]/30 flex items-center gap-2 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sintetizando Guia...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Material</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
