
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Palette, Check, Globe, Shield, Bell } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const ACCENT_COLORS = [
  { name: 'Azul', class: 'bg-blue-600', value: 'blue' },
  { name: 'Púrpura', class: 'bg-purple-600', value: 'purple' },
  { name: 'Esmeralda', class: 'bg-emerald-600', value: 'emerald' },
  { name: 'Rosa', class: 'bg-pink-600', value: 'pink' },
  { name: 'Naranja', class: 'bg-orange-600', value: 'orange' },
  { name: 'Índigo', class: 'bg-indigo-600', value: 'indigo' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ user, isOpen, onClose, onUpdateProfile }) => {
  const [name, setName] = useState(user?.displayName || '');
  const [accentColor, setAccentColor] = useState(user?.settings?.accentColor || 'blue');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setAccentColor(user.settings?.accentColor || 'blue');
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({
        displayName: name,
        settings: {
          accentColor,
          language: user?.settings?.language || 'es'
        }
      });
      onClose();
    } catch (error) {
      console.error("Error saving settings", error);
    } finally {
      setIsSaving(false);
    }
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
            className="relative glass border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-[0_100px_200px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]"
          >
            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h2 className="text-3xl font-black text-white flex items-center gap-4 font-display tracking-tight uppercase">
                <Shield size={32} className="text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
                CONFIGURACIÓN
              </h2>
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-full glass-light border border-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-14 custom-scrollbar">
              {/* Profile Section */}
              <section className="space-y-10">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                  <User size={14} className="text-blue-500/50" /> IDENTIDAD
                </h3>
                
                <div className="flex items-center gap-10">
                  <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden glass border-2 border-white/10 shrink-0 shadow-2xl group relative">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700 bg-white/[0.02]">
                        <User size={48} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 mb-3 ml-1 uppercase tracking-widest">Nombre Público</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu alias en Forge..."
                        className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-white font-light text-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all placeholder-slate-800"
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono font-bold tracking-tighter flex items-center gap-3 bg-white/[0.02] w-fit px-4 py-2 rounded-xl border border-white/5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
                      {user?.email?.toUpperCase()}
                    </div>
                  </div>
                </div>
              </section>

              {/* Personalization Section */}
              <section className="space-y-10">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                  <Palette size={14} className="text-purple-500/50" /> ESTÉTICA
                </h3>
                
                <div className="space-y-6">
                  <label className="block text-[10px] font-black text-slate-600 mb-3 ml-1 uppercase tracking-widest">NÚCLEO CROMÁTICO</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setAccentColor(color.value)}
                        className={`group relative h-16 rounded-2xl border-2 transition-all flex items-center justify-center ${
                          accentColor === color.value 
                            ? 'border-white scale-110 shadow-[0_20px_50px_rgba(0,0,0,0.4)]' 
                            : 'border-transparent hover:border-white/20 glass-light'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl ${color.class} shadow-2xl opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                        {accentColor === color.value && (
                          <motion.div 
                            layoutId="accentCheck"
                            className="absolute -top-2 -right-2 bg-white text-black rounded-full p-1 shadow-2xl"
                          >
                            <Check size={12} strokeWidth={4} />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="glass-light border border-white/5 p-6 rounded-[2rem] flex items-center justify-between group hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
                          <Globe size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">Región</p>
                          <p className="text-base text-slate-500 font-light tracking-tight">Español (Global)</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-black text-blue-400 hover:text-white transition-colors uppercase tracking-[0.2em] px-4 py-2 bg-blue-400/5 rounded-xl border border-blue-400/20">CONFIG</button>
                   </div>
                   <div className="glass-light border border-white/5 p-6 rounded-[2rem] flex items-center justify-between opacity-30 cursor-not-allowed group">
                      <div className="flex items-center gap-5">
                        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                          <Bell size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">Nodos</p>
                          <p className="text-base text-slate-600 font-light tracking-tight">Cifrado</p>
                        </div>
                      </div>
                   </div>
                </div>
              </section>
            </div>

            <div className="p-10 border-t border-white/5 bg-white/[0.02] flex gap-6">
              <button 
                onClick={onClose}
                className="flex-1 px-8 py-5 rounded-[2rem] border border-white/10 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white/5 hover:text-white transition-all shadow-2xl active:scale-95"
              >
                DESCARTAR
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`flex-[2] px-8 py-5 rounded-[2.5rem] text-black font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-[0.98] flex items-center justify-center gap-3 ${
                  isSaving ? 'bg-slate-800 text-slate-600' : 'bg-white hover:bg-slate-100'
                }`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check size={18} strokeWidth={3} />
                    SINCRONIZAR CAMBIOS
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
