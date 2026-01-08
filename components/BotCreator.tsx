
import React, { useState } from 'react';
import { X, Bot, Save, Check, Globe } from 'lucide-react';
import * as Icons from 'lucide-react';
import { BotFormData, ModelType } from '../types';
import { ICONS_LIST } from '../constants';

interface BotCreatorProps {
  onClose: () => void;
  onCreate: (data: BotFormData) => void;
}

const AVAILABLE_COLORS = [
  'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500', 'bg-slate-600', 'bg-rose-500',
  'bg-emerald-600', 'bg-violet-600',
];

export const BotCreator: React.FC<BotCreatorProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState<BotFormData>({
    name: '',
    description: '',
    systemInstruction: '',
    model: ModelType.FLASH,
    avatarColor: AVAILABLE_COLORS[0],
    icon: ICONS_LIST[0],
    useSearch: false
  });

  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const validate = (): boolean => {
    const newErrors: { name?: string; description?: string } = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    else if (formData.name.trim().length < 3) newErrors.name = 'Mínimo 3 caracteres.';

    if (!formData.description.trim()) newErrors.description = 'La descripción es obligatoria.';
    else if (formData.description.trim().length < 5) newErrors.description = 'Mínimo 5 caracteres.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onCreate(formData);
  };

  const renderIcon = (iconName: string, size = 20) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Bot;
    return <IconComponent size={size} />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-blue-600 shadow-lg shadow-blue-900/20`}>
              <Bot size={24} />
            </div>
            Configurar Bot
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Icon & Color Section */}
             <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-300">Estética</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.slice(0, 8).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarColor: color })}
                      className={`w-7 h-7 rounded-lg ${color} transition-all ${formData.avatarColor === color ? 'ring-4 ring-blue-500/30 scale-110' : 'opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ICONS_LIST.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: iconName })}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${formData.icon === iconName ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                    >
                      {renderIcon(iconName, 18)}
                    </button>
                  ))}
                </div>
             </div>

             {/* Basic Info */}
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Nombre</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    placeholder="Ej: Chef Gourmet"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  {errors.name && <p className="text-red-400 text-[10px] mt-1 font-medium">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Descripción Corta</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    placeholder="Ej: Experto en cocina fusión"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                  {errors.description && <p className="text-red-400 text-[10px] mt-1 font-medium">{errors.description}</p>}
                </div>
             </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Globe size={20} /></div>
                 <div>
                    <h4 className="text-sm font-bold text-white">Google Search Grounding</h4>
                    <p className="text-[11px] text-slate-500">Permite al bot buscar información real en internet.</p>
                 </div>
               </div>
               <button 
                type="button"
                onClick={() => setFormData({...formData, useSearch: !formData.useSearch})}
                className={`w-12 h-6 rounded-full transition-all relative ${formData.useSearch ? 'bg-blue-600' : 'bg-slate-800'}`}
               >
                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.useSearch ? 'right-1' : 'left-1'}`} />
               </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Modelo Base</label>
              <select 
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer"
                value={formData.model}
                onChange={e => setFormData({...formData, model: e.target.value as ModelType})}
              >
                <option value={ModelType.FLASH}>Gemini 3 Flash (Recomendado)</option>
                <option value={ModelType.FLASH_LITE}>Gemini Flash Lite (Súper Rápido)</option>
                <option value={ModelType.PRO}>Gemini 3 Pro (Razonamiento)</option>
                <option value={ModelType.IMAGE}>Gemini Image (Solo imágenes)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Instrucciones de Sistema</label>
              <textarea 
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 outline-none h-28 resize-none font-mono text-xs leading-relaxed"
                placeholder="Escribe cómo quieres que se comporte el bot..."
                value={formData.systemInstruction}
                onChange={e => setFormData({...formData, systemInstruction: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-blue-600/10 mt-4"
          >
            <Save size={20} /> Guardar Bot
          </button>
        </form>
      </div>
    </div>
  );
};
