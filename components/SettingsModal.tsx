
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
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield size={20} className="text-blue-500" />
                Configuración y Perfil
              </h2>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Profile Section */}
              <section className="space-y-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} /> Tu Perfil
                </h3>
                
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-800 border-2 border-slate-700 shrink-0">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Nombre Público</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre..."
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 px-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {user?.email}
                    </div>
                  </div>
                </div>
              </section>

              {/* Personalization Section */}
              <section className="space-y-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Palette size={14} /> Personalización
                </h3>
                
                <div className="space-y-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Color de Acento</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setAccentColor(color.value)}
                        className={`group relative h-12 rounded-xl border-2 transition-all flex items-center justify-center ${
                          accentColor === color.value 
                            ? 'border-white scale-105 shadow-lg' 
                            : 'border-transparent hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg ${color.class} shadow-inner`}></div>
                        {accentColor === color.value && (
                          <div className="absolute -top-1 -right-1 bg-white text-slate-900 rounded-full p-0.5">
                            <Check size={10} strokeWidth={4} />
                          </div>
                        )}
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-slate-800/30 border border-slate-700 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                          <Globe size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Idioma</p>
                          <p className="text-[10px] text-slate-500">Español (ES)</p>
                        </div>
                      </div>
                      <button className="text-xs text-blue-400 font-semibold hover:underline">Cambiar</button>
                   </div>
                   <div className="bg-slate-800/30 border border-slate-700 p-4 rounded-2xl flex items-center justify-between opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                          <Bell size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Notificaciones</p>
                          <p className="text-[10px] text-slate-500">Próximamente</p>
                        </div>
                      </div>
                   </div>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 backdrop-blur flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-2xl border border-slate-700 text-white font-bold hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`flex-[2] px-6 py-3 rounded-2xl text-black font-bold transition-all shadow-xl shadow-blue-500/10 active:scale-[0.98] flex items-center justify-center gap-2 ${
                  isSaving ? 'bg-slate-700' : 'bg-white hover:bg-slate-200'
                }`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
