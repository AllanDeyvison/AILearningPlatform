import React, { useState } from 'react';
import { Layers, X } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { soundController } from '../../utils/soundscapes';

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({ isOpen, onClose }) => {
  const { createDeck, setActiveDeckId, setActiveTab } = useStudy();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('#6366F1');

  if (!isOpen) return null;

  const colorOptions = [
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#F43F5E', // Rose
    '#06B6D4', // Cyan
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const deck = createDeck(
      title.trim(),
      description.trim() || 'Baralho de estudos',
      category.trim() || 'Geral',
      color
    );

    soundController.playSuccessChime();
    setActiveDeckId(deck.id);
    setActiveTab('flashcards');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-md bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl p-6 relative animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-[#6366F1]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Criar Novo Baralho</h2>
            <p className="text-xs text-slate-400">Organize seus cartões por matéria ou tema</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
              Título do Baralho
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Anatomia Óssea, Álgebra Linear..."
              className="w-full bg-[#111827] border border-white/10 focus:border-[#6366F1] rounded-lg px-3 py-2 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
              Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivos do baralho..."
              className="w-full bg-[#111827] border border-white/10 focus:border-[#6366F1] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
              Categoria / Tag
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Saúde, Engenharia, Concursos..."
              className="w-full bg-[#111827] border border-white/10 focus:border-[#6366F1] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
              Cor do Marcador
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#1E293B]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white rounded border border-white/10 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-semibold rounded shadow-md transition-all"
            >
              Criar Baralho
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
