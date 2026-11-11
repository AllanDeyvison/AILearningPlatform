import React, { useState, useEffect } from 'react';
import {
  Search,
  BrainCircuit,
  Layers,
  BookOpen,
  MessageSquareCode,
  Target,
  Sparkles,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface CommandPaletteProps {
  onOpenQuickQuiz: () => void;
  onOpenQuickFlashcards: () => void;
  onOpenQuickMaterial: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  onOpenQuickQuiz,
  onOpenQuickFlashcards,
  onOpenQuickMaterial,
}) => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveTab,
    togglePomodoro,
    resetPomodoro,
    setSoundscapeMode,
  } = useStudy();

  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!commandPaletteOpen) {
      setSearch('');
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const actions = [
    {
      id: 'gen-quiz',
      title: 'Gerar Simulado com IA',
      category: 'Inteligência Artificial',
      icon: Sparkles,
      iconColor: 'text-[#6366F1]',
      action: () => {
        setCommandPaletteOpen(false);
        onOpenQuickQuiz();
      },
    },
    {
      id: 'gen-cards',
      title: 'Gerar Novos Flashcards com IA',
      category: 'Inteligência Artificial',
      icon: Sparkles,
      iconColor: 'text-[#8B5CF6]',
      action: () => {
        setCommandPaletteOpen(false);
        onOpenQuickFlashcards();
      },
    },
    {
      id: 'gen-mat',
      title: 'Criar Material de Estudo com IA',
      category: 'Inteligência Artificial',
      icon: Sparkles,
      iconColor: 'text-[#10B981]',
      action: () => {
        setCommandPaletteOpen(false);
        onOpenQuickMaterial();
      },
    },
    {
      id: 'nav-dashboard',
      title: 'Ir para Painel Geral',
      category: 'Navegação',
      icon: Target,
      iconColor: 'text-slate-400',
      action: () => {
        setActiveTab('dashboard');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'nav-quizzes',
      title: 'Ver Central de Simulados',
      category: 'Navegação',
      icon: BrainCircuit,
      iconColor: 'text-slate-400',
      action: () => {
        setActiveTab('quizzes');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'nav-cards',
      title: 'Estudar Flashcards (SRS)',
      category: 'Navegação',
      icon: Layers,
      iconColor: 'text-slate-400',
      action: () => {
        setActiveTab('flashcards');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'nav-materials',
      title: 'Acessar Study Lab (Materiais)',
      category: 'Navegação',
      icon: BookOpen,
      iconColor: 'text-slate-400',
      action: () => {
        setActiveTab('materials');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'nav-tutor',
      title: 'Conversar com Tutor Cognitivo IA',
      category: 'Navegação',
      icon: MessageSquareCode,
      iconColor: 'text-[#8B5CF6]',
      action: () => {
        setActiveTab('tutor');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'nav-review',
      title: 'Ver Diagnóstico & Recomendações',
      category: 'Navegação',
      icon: Target,
      iconColor: 'text-[#F59E0B]',
      action: () => {
        setActiveTab('review');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'pomodoro-toggle',
      title: 'Iniciar / Pausar Pomodoro',
      category: 'Ferramentas de Foco',
      icon: Play,
      iconColor: 'text-[#10B981]',
      action: () => {
        togglePomodoro();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'pomodoro-reset',
      title: 'Reiniciar Pomodoro (25 min)',
      category: 'Ferramentas de Foco',
      icon: RotateCcw,
      iconColor: 'text-slate-400',
      action: () => {
        resetPomodoro('focus');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'sound-rain',
      title: 'Ativar Som de Chuva Suave',
      category: 'Ferramentas de Foco',
      icon: Sparkles,
      iconColor: 'text-[#6366F1]',
      action: () => {
        setSoundscapeMode('rain');
        setCommandPaletteOpen(false);
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md">
      <div
        className="w-full max-w-xl bg-[#1E293B] border border-[#6366F1]/30 rounded-xl shadow-2xl overflow-hidden ai-glow animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digite um comando, matéria ou ação..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-mono">
              Nenhum comando correspondente encontrado para "{search}"
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-slate-200 hover:text-white hover:bg-[#6366F1]/15 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.iconColor} group-hover:scale-110 transition-transform`} />
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-[10px] text-slate-400">{item.category}</div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Executar ↵
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-white/5 bg-[#111827] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Dica: Use ⌘K em qualquer tela</span>
          <span>ESC para fechar</span>
        </div>
      </div>
    </div>
  );
};
