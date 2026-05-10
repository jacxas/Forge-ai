
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bot, Cpu, Globe, BrainCircuit, Calendar, User } from 'lucide-react';
import { Bot as BotType } from '../types';
import * as Icons from 'lucide-react';

interface BotDetailsProps {
  bot: BotType;
  isOpen: boolean;
  onClose: () => void;
}

export const BotDetails: React.FC<BotDetailsProps> = ({ bot, isOpen, onClose }) => {
  const renderIcon = (iconName: string, size = 32) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Bot;
    return <IconComponent size={size} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-transparent backdrop-blur-[100px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative glass border border-white/10 w-full max-w-xl rounded-[3rem] overflow-hidden shadow-[0_100px_200px_rgba(0,0,0,0.8)] flex flex-col"
          >
            <div className={`h-48 ${bot.avatarColor} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 w-12 h-12 rounded-full glass-light border border-white/20 text-white hover:rotate-90 transition-all flex items-center justify-center z-20"
              >
                <X size={24} />
              </button>
              
              <div className="absolute -bottom-12 left-10 p-2 glass rounded-[2.5rem] z-10">
                <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center text-white shadow-2xl overflow-hidden border-2 border-white/10 ${bot.avatarColor}`}>
                  {bot.avatarUrl ? (
                    <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all duration-700" />
                  ) : (
                    renderIcon(bot.icon, 48)
                  )}
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-10 left-10 text-[10px] font-black text-white/40 uppercase tracking-[0.5em] font-mono">
                 ENTITY_CORE_DETAILS
              </div>
            </div>

            <div className="pt-20 p-10 space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
                <div className="space-y-4">
                  <h2 className="text-5xl font-black text-white font-display tracking-tight uppercase">{bot.name}</h2>
                  <p className="text-slate-400 text-xl font-light leading-relaxed max-w-sm">{bot.description}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                   {bot.useSearch && (
                     <div className="flex items-center gap-2.5 px-4 py-2 glass-light text-emerald-400 border border-emerald-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-2xl">
                       <Globe size={14} /> WEB_SYNC
                     </div>
                   )}
                   <div className="flex items-center gap-2.5 px-4 py-2 glass-light text-blue-400 border border-blue-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-2xl">
                     <Cpu size={14} /> {bot.model.split('-').pop()?.toUpperCase()}
                   </div>
                </div>
              </div>

              <div className="space-y-10">
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    <BrainCircuit size={16} className="text-purple-500" /> PROTOCOLO DE SISTEMA
                  </h4>
                  <div className="bg-black/30 border border-white/5 rounded-[2rem] p-8 text-base text-slate-400 leading-relaxed max-h-56 overflow-y-auto custom-scrollbar font-light italic">
                    {bot.systemInstruction || "Estructura de instrucción no definida."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="glass-light border border-white/5 p-6 rounded-[2rem] group hover:bg-white/5 transition-all">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest flex items-center gap-2">
                      <User size={14} className="text-blue-500/50" /> ORIGEN
                    </div>
                    <div className="text-white text-base font-black tracking-tight uppercase">{bot.isDefault ? 'FORGE_SYSTEM' : 'USER_DEFINED'}</div>
                  </div>
                  <div className="glass-light border border-white/5 p-6 rounded-[2rem] group hover:bg-white/5 transition-all">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest flex items-center gap-2">
                      <Calendar size={14} className="text-rose-500/50" /> CATEGORÍA
                    </div>
                    <div className="text-white text-base font-black tracking-tight uppercase">{bot.isDefault ? 'NÚCLEO' : 'SINTÉTICO'}</div>
                  </div>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full bg-white hover:bg-slate-100 text-black font-black uppercase tracking-[0.3em] text-[10px] py-6 rounded-[2.5rem] transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-[0.98]"
              >
                CERRAR EXPEDIENTE
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
