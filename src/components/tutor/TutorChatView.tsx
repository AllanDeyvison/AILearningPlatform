import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareCode,
  Sparkles,
  Send,
  Trash2,
  HelpCircle,
  Lightbulb,
  Compass,
  GraduationCap,
  Loader2,
  Bot,
  User,
  ArrowRight,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { TutorPersona } from '../../types';

export const TutorChatView: React.FC = () => {
  const {
    tutorMessages,
    tutorPersona,
    setTutorPersona,
    sendTutorMessage,
    isTutorLoading,
    clearTutorChat,
    decks,
  } = useStudy();

  const [input, setInput] = useState('');
  const [selectedSubjectContext, setSelectedSubjectContext] = useState<string>('Geral');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tutorMessages, isTutorLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTutorLoading) return;
    const msg = input.trim();
    setInput('');
    await sendTutorMessage(msg, selectedSubjectContext);
  };

  const personas = [
    {
      id: 'feynman' as TutorPersona,
      title: 'Método Feynman',
      subtitle: 'Analogias do cotidiano & clareza extrema',
      icon: Lightbulb,
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-200',
    },
    {
      id: 'socratic' as TutorPersona,
      title: 'Professor Socrático',
      subtitle: 'Perguntas guiadas para você raciocinar',
      icon: Compass,
      color: 'text-[#6366F1]',
      activeBg: 'bg-[#6366F1]/15 border-[#6366F1]/40 text-[#C0C1FF]',
    },
    {
      id: 'academic' as TutorPersona,
      title: 'Especialista Técnico',
      subtitle: 'Rigor conceitual e profundidade formal',
      icon: GraduationCap,
      color: 'text-[#10B981]',
      activeBg: 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] pb-2">
      {/* Top Header & Persona Switcher */}
      <div className="bg-[#111827] border border-white/10 rounded-xl p-3 md:p-4 mb-3 shadow-lg space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
              <MessageSquareCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Tutor Cognitivo Adaptativo</h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Modelagem pedagógica em tempo real com Gemini 2.5
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Subject Context Selector */}
            <select
              value={selectedSubjectContext}
              onChange={(e) => setSelectedSubjectContext(e.target.value)}
              className="bg-[#1E293B] border border-white/10 text-slate-300 text-xs rounded px-2.5 py-1.5 focus:outline-none"
            >
              <option value="Geral">Contexto Geral</option>
              {decks.map((d) => (
                <option key={d.id} value={d.title}>
                  {d.title}
                </option>
              ))}
            </select>

            <button
              onClick={clearTutorChat}
              className="p-1.5 text-slate-400 hover:text-[#F43F5E] rounded border border-white/10 hover:bg-white/5 transition-colors"
              title="Limpar histórico"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Persona Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {personas.map((p) => {
            const Icon = p.icon;
            const isCurrent = tutorPersona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setTutorPersona(p.id)}
                className={`p-2.5 rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                  isCurrent
                    ? p.activeBg
                    : 'bg-[#1E293B] border-white/5 text-slate-300 hover:border-white/15'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${p.color}`} />
                <div className="truncate">
                  <div className="text-xs font-semibold leading-tight">{p.title}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto bg-[#1E293B]/70 border border-white/[0.08] rounded-xl p-4 md:p-6 space-y-4 shadow-inner">
        {tutorMessages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-xl p-4 text-xs md:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/20'
                    : 'bg-[#111827] border border-white/10 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Follow up suggestion chips */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Perguntas sugeridas para continuar:
                    </div>
                    <div className="flex flex-col gap-1">
                      {msg.suggestedFollowUps.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => {
                            setInput(q);
                            sendTutorMessage(q, selectedSubjectContext);
                          }}
                          className="text-left text-xs text-[#C0C1FF] hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded border border-white/5 transition-all flex items-center justify-between group"
                        >
                          <span>{q}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[10px] font-mono text-slate-400 text-right mt-2 opacity-60">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-[#6366F1]/30 border border-[#6366F1]/50 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isTutorLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#111827] border border-white/10 rounded-xl p-3 text-xs text-slate-300 flex items-center gap-2 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8B5CF6]" />
              <span>Formulando explicação pedagógica...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Bar */}
      <form onSubmit={handleSend} className="mt-3 relative shrink-0">
        <div className="flex items-center bg-[#111827] border border-white/15 focus-within:border-[#6366F1] rounded-xl overflow-hidden shadow-2xl transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder="Pergunte sobre qualquer matéria, peça uma analogia ou peça para ser desafiado..."
            className="w-full bg-transparent px-4 py-3 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
          />

          <button
            type="submit"
            disabled={!input.trim() || isTutorLoading}
            className="m-2 p-2.5 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 text-white rounded-lg shadow-md shadow-[#6366F1]/20 transition-all shrink-0"
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
