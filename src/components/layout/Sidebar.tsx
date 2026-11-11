import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  Layers,
  BookOpen,
  MessageSquareCode,
  Target,
  Sparkles,
  X,
  Plus,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenQuickQuiz: () => void;
  onOpenQuickFlashcards: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobile,
  onOpenQuickQuiz,
  onOpenQuickFlashcards,
}) => {
  const { activeTab, setActiveTab, getDueCards, quizzes, decks } = useStudy();

  const totalDueCards = getDueCards().length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Painel Geral',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'quizzes',
      label: 'Simulados IA',
      icon: BrainCircuit,
      badge: `${quizzes.length}`,
    },
    {
      id: 'flashcards',
      label: 'Flashcards & SRS',
      icon: Layers,
      badge: totalDueCards > 0 ? `${totalDueCards} hoje` : null,
      badgeColor: totalDueCards > 0 ? 'bg-[#6366F1]/20 text-[#C0C1FF] border-[#6366F1]/40' : undefined,
    },
    {
      id: 'materials',
      label: 'Study Lab (Materiais)',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'tutor',
      label: 'Tutor Cognitivo',
      icon: MessageSquareCode,
      badge: 'IA',
      badgeColor: 'bg-[#8B5CF6]/20 text-[#D0BCFF] border-[#8B5CF6]/40',
    },
    {
      id: 'review',
      label: 'Trilha de Revisão',
      icon: Target,
      badge: null,
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Rail */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#111827] border-r border-white/[0.06] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                Cognitio Studio
                <span className="text-[10px] font-mono px-1 rounded bg-[#6366F1]/20 text-[#C0C1FF] border border-[#6366F1]/30">
                  PRO
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">Ambiente de Foco</div>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Launch Actions */}
        <div className="p-3 border-b border-white/[0.06] space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 px-2 tracking-wider">
            Ações com IA
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                onOpenQuickQuiz();
                onCloseMobile();
              }}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#1E293B] hover:bg-[#6366F1]/15 text-slate-200 hover:text-white border border-white/10 hover:border-[#6366F1]/40 rounded text-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Simulado</span>
            </button>
            <button
              onClick={() => {
                onOpenQuickFlashcards();
                onCloseMobile();
              }}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#1E293B] hover:bg-[#8B5CF6]/15 text-slate-200 hover:text-white border border-white/10 hover:border-[#8B5CF6]/40 rounded text-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Cards</span>
            </button>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400 px-3 py-1 tracking-wider">
            Navegação Principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full border ${
                      item.badgeColor
                        ? item.badgeColor
                        : isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Decks Mini-Summary */}
        <div className="p-3 border-t border-white/[0.06] bg-[#0B0F19]/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400">BARALHOS ATIVOS</span>
            <span className="text-[11px] font-mono text-[#6366F1]">{decks.length}</span>
          </div>
          <div className="space-y-1">
            {decks.slice(0, 3).map((d) => (
              <div
                key={d.id}
                onClick={() => {
                  setActiveTab('flashcards');
                  onCloseMobile();
                }}
                className="flex items-center justify-between text-xs text-slate-300 hover:text-white p-1 rounded hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="truncate">{d.title}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                  {getDueCards(d.id).length} devidos
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};
