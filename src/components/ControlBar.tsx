import React from 'react';
import { Mic, MicOff, Phone, PhoneOff, MoreHorizontal, Loader2 } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface ControlBarProps {
  status: ConnectionStatus;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleCall: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({ status, isMuted, onToggleMute, onToggleCall }) => {
  const isConnected = status === ConnectionStatus.CONNECTED;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 rounded-full bg-slate-800/80 backdrop-blur-xl border border-slate-700 shadow-2xl z-40 transition-all hover:scale-[1.02]">
      <button 
        onClick={onToggleMute}
        disabled={!isConnected}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all cursor-pointer ${
          isMuted ? 'bg-red-500/20 text-red-500' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        } ${!isConnected ? 'opacity-30 cursor-not-allowed' : ''}`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <MicOff className="w-5 h-5 text-red-500" /> : <Mic className="w-5 h-5 text-slate-300" />}
      </button>

      <button 
        onClick={onToggleCall}
        className={`px-8 py-3 flex items-center gap-3 rounded-full font-bold transition-all shadow-lg active:scale-95 cursor-pointer ${
          isConnected 
            ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' 
            : status === ConnectionStatus.CONNECTING
              ? 'bg-slate-700 text-slate-400 cursor-wait'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
        }`}
      >
        {status === ConnectionStatus.CONNECTING ? (
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        ) : isConnected ? (
          <PhoneOff className="w-4 h-4 text-white" />
        ) : (
          <Phone className="w-4 h-4 text-white" />
        )}
        <span>{isConnected ? 'Colgar' : status === ConnectionStatus.CONNECTING ? 'Conectando...' : 'Llamar'}</span>
      </button>

      <div className="w-12 h-12 flex items-center justify-center text-slate-400">
        <MoreHorizontal className="w-5 h-5 text-slate-400" />
      </div>
    </div>
  );
};

export default ControlBar;
