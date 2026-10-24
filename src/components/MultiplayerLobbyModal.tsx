import React, { useState } from 'react';
import { PlayerData } from '../types/game';
import { X, Users, Globe, Copy, Check, Sparkles } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface MultiplayerLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: string;
  onSwitchRoom: (newRoom: string) => void;
  players: PlayerData[];
  selfId: string;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  isOpen,
  onClose,
  currentRoom,
  onSwitchRoom,
  players,
  selfId,
}) => {
  const [inputRoom, setInputRoom] = useState(currentRoom);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentRoom);
    setCopied(true);
    sounds.playScan();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRoom.trim() && inputRoom.trim().toUpperCase() !== currentRoom) {
      sounds.playJump();
      onSwitchRoom(inputRoom.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Multiplayer Lab Kelas IPA</h2>
              <p className="text-xs text-emerald-300">Jelajahi Dunia 3D Sel Tumbuhan Bersama Teman Sekelas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Current Room Banner */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Ruang Kelas Aktif:</div>
              <div className="text-xl font-black text-emerald-400 tracking-wider flex items-center gap-2">
                <span>{currentRoom}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                  title="Salin Kode Ruang"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/5">
              🟢 <span className="font-bold text-white">{players.length} Siswa</span> Terhubung
            </div>
          </div>

          {/* Join / Switch Room Form */}
          <form onSubmit={handleJoin} className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 block">Pindah / Buat Kode Ruang Baru:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: KELAS-8B, LAB-IPA..."
                value={inputRoom}
                onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-white/20 rounded-xl text-white font-mono text-sm uppercase focus:outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md active:scale-95 transition-transform"
              >
                Gabung Ruang
              </button>
            </div>
          </form>

          {/* Connected Classmates Roster */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Daftar Siswa di Ruang Ini ({players.length})</span>
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {players.map((p) => {
                const isSelf = p.id === selfId;

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isSelf
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : 'bg-slate-800/40 border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-white shadow-sm"
                        style={{ backgroundColor: p.customization?.shirtColor || '#2563eb' }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold flex items-center gap-1.5 text-white">
                          <span>{p.name}</span>
                          {isSelf && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400/40">
                              Kamu
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{p.title || 'Penjelajah Sel'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-amber-400">{p.collectedAtp || 0} ATP</div>
                        <div className="text-[10px] text-slate-400">Skor: {p.score || 0}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
