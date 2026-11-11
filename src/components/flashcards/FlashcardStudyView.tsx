import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Plus,
  RotateCw,
  Lightbulb,
  CheckCircle,
  Clock,
  ArrowLeft,
  Flame,
  Award,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStudy } from '../../context/StudyContext';
import { Deck, Flashcard } from '../../types';
import { soundController } from '../../utils/soundscapes';

interface FlashcardStudyViewProps {
  onOpenCreateCardsModal: () => void;
  onOpenCreateDeckModal: () => void;
}

export const FlashcardStudyView: React.FC<FlashcardStudyViewProps> = ({
  onOpenCreateCardsModal,
  onOpenCreateDeckModal,
}) => {
  const {
    decks,
    flashcards,
    getCardsForDeck,
    getDueCards,
    reviewFlashcard,
    deleteDeck,
    activeDeckId,
    setActiveDeckId,
  } = useStudy();

  // Study Session State
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  const activeDeck = decks.find((d) => d.id === activeDeckId);

  // Start study session for a deck (or all due cards)
  const handleStartSession = (deckId?: string) => {
    const due = deckId ? getDueCards(deckId) : getDueCards();
    const cardsToStudy = due.length > 0 ? due : deckId ? getCardsForDeck(deckId) : flashcards;

    if (cardsToStudy.length === 0) {
      alert('Nenhum flashcard disponível neste baralho.');
      return;
    }

    setSessionCards(cardsToStudy);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setSessionFinished(false);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    setActiveDeckId(deckId || null);
  };

  // Keyboard shortcut listener for active recall (Space to flip, 1-4 to rate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sessionCards.length || sessionFinished) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        if (e.key === '2') handleRate('hard');
        if (e.key === '3') handleRate('good');
        if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionCards, currentIndex, isFlipped, sessionFinished]);

  const handleFlip = () => {
    soundController.playFlipSound();
    setIsFlipped((prev) => !prev);
  };

  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const currentCard = sessionCards[currentIndex];
    if (!currentCard) return;

    reviewFlashcard(currentCard.id, rating);
    setSessionStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

    if (currentIndex + 1 < sessionCards.length) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionFinished(true);
      soundController.playSuccessChime();
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
    }
  };

  // -------------------------------------------------------------
  // RENDER: Active Study Session (3D Flip Card)
  // -------------------------------------------------------------
  if (sessionCards.length > 0 && !sessionFinished) {
    const currentCard = sessionCards[currentIndex];
    const progressPercent = Math.round(((currentIndex + 1) / sessionCards.length) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-16">
        {/* Session Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSessionCards([]);
              setActiveDeckId(null);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-slate-400">
              {currentIndex + 1} / {sessionCards.length}
            </span>
            <div className="w-24 h-2 bg-[#111827] rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-[#6366F1] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3D Flip Card Area */}
        <div
          onClick={handleFlip}
          className="relative min-h-[340px] md:min-h-[380px] w-full cursor-pointer perspective-1000 select-none group"
        >
          <div
            className={`w-full h-full min-h-[340px] md:min-h-[380px] rounded-xl border border-white/10 p-6 md:p-8 flex flex-col justify-between transition-transform duration-500 transform-style-3d shadow-2xl relative ${
              isFlipped
                ? 'rotate-y-180 bg-[#1E293B] border-[#6366F1]/40'
                : 'bg-[#1E293B] hover:border-white/20'
            }`}
          >
            {/* FRONT OF CARD */}
            {!isFlipped ? (
              <div className="flex flex-col justify-between h-full flex-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#6366F1]/15 text-[#C0C1FF] border border-[#6366F1]/30">
                      {currentCard.category || activeDeck?.title || 'Conceito'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Dificuldade: {currentCard.difficulty}
                    </span>
                  </div>

                  <h3 className="text-lg md:text-xl font-medium text-white leading-relaxed mt-4">
                    {currentCard.front}
                  </h3>

                  {currentCard.mnemonicHint && (
                    <div className="mt-4">
                      {showHint ? (
                        <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{currentCard.mnemonicHint}</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHint(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-300 font-mono transition-colors"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Ver Dica Mnemônica</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Clique no cartão ou pressione [ESPAÇO] para virar</span>
                  <RotateCw className="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                </div>
              </div>
            ) : (
              /* BACK OF CARD (Flipped) */
              <div className="flex flex-col justify-between h-full flex-1 rotate-y-180">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                      Resposta / Fundamentação
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Intervalo atual: {currentCard.intervalDays}d
                    </span>
                  </div>

                  <p className="text-base md:text-lg text-slate-100 leading-relaxed font-sans mt-2 whitespace-pre-wrap">
                    {currentCard.back}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 text-[11px] text-slate-400 font-mono text-center">
                  Avalie seu nível de esforço de recuperação abaixo
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Recall Action Rating Buttons (SM-2) */}
        {isFlipped ? (
          <div className="space-y-2 animate-in fade-in duration-200">
            <div className="text-center text-xs font-mono text-slate-400">
              COMO FOI A RECUPERAÇÃO DESTA MEMÓRIA?
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Again */}
              <button
                onClick={() => handleRate('again')}
                className="p-3 rounded-lg bg-[#F43F5E]/10 hover:bg-[#F43F5E]/25 border border-[#F43F5E]/30 text-white flex flex-col items-center justify-center transition-all group shadow-lg"
              >
                <div className="font-semibold text-xs text-[#F43F5E]">Novamente</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">1 dia</div>
                <kbd className="mt-1 text-[9px] font-mono px-1 rounded bg-[#0B0F19] text-slate-400 border border-white/10">
                  Tecla [1]
                </kbd>
              </button>

              {/* Hard */}
              <button
                onClick={() => handleRate('hard')}
                className="p-3 rounded-lg bg-[#F59E0B]/10 hover:bg-[#F59E0B]/25 border border-[#F59E0B]/30 text-white flex flex-col items-center justify-center transition-all group shadow-lg"
              >
                <div className="font-semibold text-xs text-[#F59E0B]">Difícil</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">2 dias</div>
                <kbd className="mt-1 text-[9px] font-mono px-1 rounded bg-[#0B0F19] text-slate-400 border border-white/10">
                  Tecla [2]
                </kbd>
              </button>

              {/* Good */}
              <button
                onClick={() => handleRate('good')}
                className="p-3 rounded-lg bg-[#6366F1]/15 hover:bg-[#6366F1]/30 border border-[#6366F1]/40 text-white flex flex-col items-center justify-center transition-all group shadow-lg"
              >
                <div className="font-semibold text-xs text-[#C0C1FF]">Bom</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">4 dias</div>
                <kbd className="mt-1 text-[9px] font-mono px-1 rounded bg-[#0B0F19] text-slate-400 border border-white/10">
                  Tecla [3]
                </kbd>
              </button>

              {/* Easy */}
              <button
                onClick={() => handleRate('easy')}
                className="p-3 rounded-lg bg-[#10B981]/10 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-white flex flex-col items-center justify-center transition-all group shadow-lg"
              >
                <div className="font-semibold text-xs text-[#10B981]">Fácil</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">7 dias</div>
                <kbd className="mt-1 text-[9px] font-mono px-1 rounded bg-[#0B0F19] text-slate-400 border border-white/10">
                  Tecla [4]
                </kbd>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={handleFlip}
              className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#6366F1]/20 transition-all"
            >
              Virar Cartão (Espaço)
            </button>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Session Completed Celebration
  // -------------------------------------------------------------
  if (sessionFinished) {
    return (
      <div className="max-w-xl mx-auto bg-[#1E293B] border border-white/10 rounded-xl p-8 text-center shadow-2xl space-y-6 animate-in zoom-in-95">
        <div className="w-14 h-14 rounded-full bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] mx-auto">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Sessão Concluída com Sucesso!</h2>
          <p className="text-xs text-slate-400">
            Você reforçou os circuitos neurais de {sessionCards.length} cartões hoje.
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-4 gap-2 bg-[#111827] p-3 rounded-lg border border-white/5 text-xs font-mono">
          <div>
            <div className="text-[#F43F5E] font-bold">{sessionStats.again}</div>
            <div className="text-[10px] text-slate-400">Novamente</div>
          </div>
          <div>
            <div className="text-[#F59E0B] font-bold">{sessionStats.hard}</div>
            <div className="text-[10px] text-slate-400">Difícil</div>
          </div>
          <div>
            <div className="text-[#6366F1] font-bold">{sessionStats.good}</div>
            <div className="text-[10px] text-slate-400">Bom</div>
          </div>
          <div>
            <div className="text-[#10B981] font-bold">{sessionStats.easy}</div>
            <div className="text-[10px] text-slate-400">Fácil</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => handleStartSession(activeDeckId || undefined)}
            className="px-4 py-2 bg-[#1E293B] hover:bg-white/10 text-white text-xs font-medium border border-white/10 rounded transition-colors"
          >
            Revisar Novamente
          </button>
          <button
            onClick={() => {
              setSessionCards([]);
              setActiveDeckId(null);
            }}
            className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-semibold rounded shadow-md shadow-[#6366F1]/20 transition-all"
          >
            Voltar aos Baralhos
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Deck Catalog
  // -------------------------------------------------------------
  const globalDueCount = getDueCards().length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#8B5CF6]" />
            <span>Baralhos de Evocação Ativa (SRS)</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Algoritmo de repetição espaçada SM-2. Treine active recall sem ilusão de competência.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCreateDeckModal}
            className="px-3 py-2 bg-[#1E293B] hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            <span>Novo Baralho</span>
          </button>

          <button
            onClick={onOpenCreateCardsModal}
            className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#8B5CF6]/20 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gerar Flashcards com IA</span>
          </button>
        </div>
      </div>

      {/* Global Due review CTA */}
      {globalDueCount > 0 && (
        <div className="bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#6366F1]/20 text-[#C0C1FF]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">
                Você tem {globalDueCount} cartões aguardando revisão hoje!
              </div>
              <div className="text-xs text-slate-300">
                A repetição diária consolida memórias na transição de curto para longo prazo.
              </div>
            </div>
          </div>

          <button
            onClick={() => handleStartSession()}
            className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-semibold rounded shadow-md shadow-[#6366F1]/30 transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>Iniciar Fila Geral ({globalDueCount})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Decks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {decks.map((deck) => {
          const cardsInDeck = getCardsForDeck(deck.id);
          const dueInDeck = getDueCards(deck.id).length;

          return (
            <div
              key={deck.id}
              className="bg-[#1E293B] border border-white/[0.08] hover:border-white/20 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: deck.color }} />
                    <span className="text-[10px] font-mono uppercase text-slate-400">{deck.category}</span>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover o baralho "${deck.title}" e seus cartões?`)) {
                        deleteDeck(deck.id);
                      }
                    }}
                    className="p-1 text-slate-500 hover:text-[#F43F5E] rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Excluir baralho"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-[#C0C1FF] transition-colors">
                  {deck.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {deck.description}
                </p>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mb-4">
                  <div>
                    <span className="text-slate-200 font-bold">{cardsInDeck.length}</span> cards
                  </div>
                  <div>•</div>
                  <div>
                    <span className="text-[#C0C1FF] font-bold">{dueInDeck}</span> devidos hoje
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {deck.totalCardsReviewed || 0} revisões feitas
                </span>

                <button
                  onClick={() => handleStartSession(deck.id)}
                  className="px-3.5 py-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5"
                >
                  <span>Estudar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
