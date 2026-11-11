import React, { useState } from 'react';
import { Sparkles, X, Layers, Loader2 } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { soundController } from '../../utils/soundscapes';

interface CreateFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateFlashcardsModal: React.FC<CreateFlashcardsModalProps> = ({ isOpen, onClose }) => {
  const { decks, createDeck, addFlashcards, setActiveDeckId, setActiveTab } = useStudy();

  const [topic, setTopic] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [deckSelection, setDeckSelection] = useState<string>(decks[0]?.id || 'new');
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [cardCount, setCardCount] = useState(8);
  const [difficulty, setDifficulty] = useState('misto');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !sourceText.trim()) {
      setError('Informe um tema ou texto base para os cartões.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || 'Assunto Personalizado',
          sourceText: sourceText.trim(),
          count: cardCount,
          difficulty,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${res.status} ao gerar cartões.`);
      }

      const data = await res.json();
      if (!data.deck?.cards || !Array.isArray(data.deck.cards)) {
        throw new Error('Falha ao estruturar baralho.');
      }

      let targetDeckId = deckSelection;
      if (deckSelection === 'new') {
        const titleToUse = newDeckTitle.trim() || data.deck.deckTitle || topic || 'Novo Baralho';
        const created = createDeck(titleToUse, `Baralho com IA sobre ${topic}`, topic, '#8B5CF6');
        targetDeckId = created.id;
      }

      const formattedCards = data.deck.cards.map((c: any) => ({
        deckId: targetDeckId,
        front: c.front,
        back: c.back,
        category: c.category || topic,
        difficulty: (c.difficulty as any) || 'medium',
        mnemonicHint: c.mnemonicHint,
      }));

      addFlashcards(formattedCards);
      soundController.playSuccessChime();
      setActiveDeckId(targetDeckId);
      setActiveTab('flashcards');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao gerar flashcards.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-xl bg-[#1E293B] border border-[#8B5CF6]/30 rounded-xl shadow-2xl p-6 relative ai-glow animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Gerar Flashcards com IA</h2>
            <p className="text-xs text-slate-400">Evocação ativa com formulação atômica SuperMemo</p>
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
              Tema dos Flashcards
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Fórmulas de Física Mecânica, Vocabulário Jurídico, Algoritmos de Grafos..."
              className="w-full bg-[#111827] border border-white/10 focus:border-[#8B5CF6] rounded-lg px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
              Texto ou Notas de Apoio (Opcional)
            </label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={3}
              placeholder="Cole resumos, transcrição de áudio ou texto de apostila..."
              className="w-full bg-[#111827] border border-white/10 focus:border-[#8B5CF6] rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Destino</label>
              <select
                value={deckSelection}
                onChange={(e) => setDeckSelection(e.target.value)}
                className="w-full bg-[#111827] border border-white/10 text-xs rounded-lg p-2 text-white focus:outline-none"
              >
                <option value="new">+ Criar Novo Baralho</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            {deckSelection === 'new' ? (
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Título do Baralho</label>
                <input
                  type="text"
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  placeholder="Nome do baralho..."
                  className="w-full bg-[#111827] border border-white/10 text-xs rounded-lg p-2 text-white focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Quantidade</label>
                <select
                  value={cardCount}
                  onChange={(e) => setCardCount(Number(e.target.value))}
                  className="w-full bg-[#111827] border border-white/10 text-xs rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value={5}>5 cards</option>
                  <option value={8}>8 cards</option>
                  <option value={12}>12 cards</option>
                  <option value={15}>15 cards</option>
                </select>
              </div>
            )}
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
              className="px-5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-[#8B5CF6]/30 flex items-center gap-2 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando Cartões...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Flashcards</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
