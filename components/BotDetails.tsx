
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
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className={`h-32 ${bot.avatarColor} relative`}>
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="absolute -bottom-10 left-8 p-1 bg-slate-900 rounded-3xl">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-xl ${bot.avatarColor}`}>
                  {renderIcon(bot.icon, 40)}
                </div>
              </div>
            </div>

            <div className="pt-14 p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-black text-white">{bot.name}</h2>
                  <p className="text-slate-400 mt-1">{bot.description}</p>
                </div>
                <div className="flex gap-2">
                   {bot.useSearch && (
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
                       <Globe size={12} /> Web Connect
                     </div>
                   )}
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold uppercase">
                     <Cpu size={12} /> {bot.model.split('-')[1]}
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <BrainCircuit size={14} /> Instrucciones del Sistema
                  </h4>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                    {bot.systemInstruction || "No hay instrucciones específicas."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                      <User size={12} /> Creado por
                    </div>
                    <div className="text-white text-sm font-medium">{bot.isDefault ? 'Sistema' : 'Usuario'}</div>
                  </div>
                  <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                      <Calendar size={12} /> Tipo de Bot
                    </div>
                    <div className="text-white text-sm font-medium">{bot.isDefault ? 'Oficial' : 'Personalizo'}</div>
                  </div>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full mt-8 bg-white hover:bg-slate-200 text-black font-bold py-4 rounded-2xl transition-all shadow-xl shadow-white/5 active:scale-[0.98]"
              >
                Cerrar Panel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
