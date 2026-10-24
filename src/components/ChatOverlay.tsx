import React, { useState } from 'react';
import { ChatMessage } from '../types/game';
import { MessageSquare, Send, X, ChevronUp, ChevronDown } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface ChatOverlayProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const QUICK_PHRASES = [
  '🌿 Ayo kumpul di Kloroplas!',
  '⚡ Aku nemu banyak ATP di Mitokondria!',
  '🟣 Nukleus & DNA keren banget!',
  '💧 Vakuolanya mantul tinggi banget!',
  '🧱 Dinding sel kokoh dari selulosa!',
  '🍃 Yuk kita cek Stomata daun!',
];

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  messages,
  onSendMessage,
  isOpen,
  onToggle,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sounds.playChat();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickSend = (phrase: string) => {
    sounds.playChat();
    onSendMessage(phrase);
  };

  return (
    <div className="absolute top-16 left-4 z-30 pointer-events-auto w-72 sm:w-80">
      {/* Header Bar */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between px-3.5 py-2 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg cursor-pointer hover:bg-slate-800/85 transition-colors"
      >
        <div className="flex items-center gap-2 text-white">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">Obrolan Lab Kelas</span>
          {messages.length > 0 && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
              {messages.length}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </div>

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="mt-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col">
          {/* Messages list */}
          <div className="p-3 max-h-48 overflow-y-auto space-y-2 text-xs">
            {messages.length === 0 ? (
              <div className="text-slate-500 text-center py-4 italic text-[11px]">
                Belum ada pesan. Sapa teman sekelasmu!
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="leading-snug">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-emerald-400 text-[11px]">{m.senderName}:</span>
                    <span className="text-[9px] text-slate-500">{m.time}</span>
                  </div>
                  <div className="text-slate-200 text-xs pl-1">{m.text}</div>
                </div>
              ))
            )}
          </div>

          {/* Quick biology phrases (mobile friendly!) */}
          <div className="px-2 py-1.5 bg-slate-950/60 border-t border-white/10 flex gap-1.5 overflow-x-auto">
            {QUICK_PHRASES.map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickSend(phrase)}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 text-[10px] font-medium rounded-lg whitespace-nowrap transition-colors"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Input text form */}
          <form onSubmit={handleSend} className="p-2 bg-slate-950 border-t border-white/10 flex gap-1.5">
            <input
              type="text"
              placeholder="Ketik pesan..."
              maxLength={60}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl active:scale-95 transition-transform"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
