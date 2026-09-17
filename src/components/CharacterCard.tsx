import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User } from 'lucide-react';
import { Character } from '../types';
import { motion } from 'motion/react';

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/chat/${character.id}`)}
      className="group relative aspect-[2/3] rounded-[2rem] overflow-hidden cursor-pointer shadow-2xl transition-all duration-500"
    >
      {/* Image */}
      <img
        src={character.avatarUrl || `https://picsum.photos/seed/${character.id}/600/900`}
        alt={character.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        referrerPolicy="no-referrer"
      />
      
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-1 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">{character.name}</h3>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
        </div>
        
        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-medium opacity-0 group-hover:opacity-100 transition-all duration-500 delay-75">
          {character.description}
        </p>

        <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white bg-purple-600 px-4 py-2 rounded-full shadow-lg shadow-purple-600/40">
            <MessageSquare className="w-3 h-3" />
            <span>Chatear</span>
          </div>
          {character.category && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 bg-white/10 px-3 py-2 rounded-full backdrop-blur-md">
              {character.category}
            </span>
          )}
        </div>
      </div>

      {/* Hover Border */}
      <div className="absolute inset-0 border-2 border-purple-500/0 group-hover:border-purple-500/40 rounded-[2rem] transition-all duration-500" />
    </motion.div>
  );
}
