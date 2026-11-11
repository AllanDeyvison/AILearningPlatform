import React from 'react';
import {
  Flame,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Command,
  Headphones,
  Menu,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const {
    stats,
    pomodoroSeconds,
    pomodoroMode,
    isPomodoroRunning,
    togglePomodoro,
    resetPomodoro,
    soundscapeMode,
    setSoundscapeMode,
    setCommandPaletteOpen,
  } = useStudy();

  const minutes = Math.floor(pomodoroSeconds / 60);
  const seconds = pomodoroSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      {/* Left: Mobile trigger & context indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded border border-white/10 hover:bg-white/5 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-mono text-xs text-slate-400">COGNITIO ENGINE • V2.5 ONLINE</span>
        </div>
      </div>

      {/* Center: Pomodoro & Focus Station */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-[#111827] border border-white/10 rounded-lg px-2.5 py-1 gap-2 shadow-inner">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1 py-0.5 rounded bg-white/5">
            {pomodoroMode === 'focus' ? 'Foco' : 'Pausa'}
          </span>
          <span className="font-mono text-xs md:text-sm font-semibold tracking-wider text-slate-200 min-w-[42px] text-center">
            {formattedTime}
          </span>
          <button
            onClick={togglePomodoro}
            className="p-1 rounded text-slate-300 hover:text-[#6366F1] hover:bg-white/5 transition-colors"
            title={isPomodoroRunning ? 'Pausar Pomodoro' : 'Iniciar Pomodoro'}
          >
            {isPomodoroRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => resetPomodoro(pomodoroMode)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Reiniciar cronômetro"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ambient Sound Selector */}
        <div className="relative group hidden sm:block">
          <div className="flex items-center gap-1.5 bg-[#111827] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 cursor-pointer hover:border-[#6366F1]/50 transition-colors">
            {soundscapeMode === 'off' ? (
              <Headphones className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#6366F1] animate-pulse" />
            )}
            <span className="font-mono text-xs">
              {soundscapeMode === 'off'
                ? 'Sons'
                : soundscapeMode === 'rain'
                ? 'Chuva'
                : soundscapeMode === 'whitenoise'
                ? 'Ruído Branco'
                : 'Ondas Alpha'}
            </span>
          </div>

          {/* Soundscape Dropdown Menu */}
          <div className="absolute right-0 mt-1 w-44 bg-[#1E293B] border border-white/10 rounded-lg p-1.5 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
            <div className="text-[10px] font-mono uppercase text-slate-400 px-2 py-1">Som de Foco</div>
            <button
              onClick={() => setSoundscapeMode('off')}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded text-left transition-colors ${
                soundscapeMode === 'off' ? 'bg-[#6366F1]/20 text-[#C0C1FF]' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span>Silêncio</span>
              {soundscapeMode === 'off' && <VolumeX className="w-3 h-3 text-slate-400" />}
            </button>
            <button
              onClick={() => setSoundscapeMode('rain')}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded text-left transition-colors ${
                soundscapeMode === 'rain' ? 'bg-[#6366F1]/20 text-[#C0C1FF]' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span>Chuva Suave</span>
              {soundscapeMode === 'rain' && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
            </button>
            <button
              onClick={() => setSoundscapeMode('whitenoise')}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded text-left transition-colors ${
                soundscapeMode === 'whitenoise' ? 'bg-[#6366F1]/20 text-[#C0C1FF]' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span>Ruído Branco Fino</span>
              {soundscapeMode === 'whitenoise' && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
            </button>
            <button
              onClick={() => setSoundscapeMode('alpha')}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded text-left transition-colors ${
                soundscapeMode === 'alpha' ? 'bg-[#6366F1]/20 text-[#C0C1FF]' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span>Ondas Alpha (Binaural)</span>
              {soundscapeMode === 'alpha' && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Streak & Command Palette trigger */}
      <div className="flex items-center gap-3">
        {/* Streak Counter */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B]"
          title="Ofensiva diária de estudos ativos"
        >
          <Flame className="w-3.5 h-3.5 fill-[#F59E0B]" />
          <span className="font-mono text-xs font-semibold">{stats.streakDays} dias</span>
        </div>

        {/* Command Palette Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 text-xs text-slate-400 bg-[#111827] border border-white/10 hover:border-[#6366F1]/40 rounded-lg hover:text-slate-200 transition-colors"
        >
          <Command className="w-3.5 h-3.5" />
          <span>Comando</span>
          <kbd className="font-mono text-[10px] bg-[#0B0F19] text-slate-400 px-1 py-0.5 rounded border border-white/15">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
};
