
import React, { useState } from 'react';
import { X, Bot as BotIcon, Save, Check, Globe, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import * as Icons from 'lucide-react';
import { BotFormData, ModelType, Bot } from '../types';
import { ICONS_LIST, ICONS_CATEGORIES } from '../constants';
import { generateImage } from '../services/geminiService';
import { compressImage } from '../lib/imageUtils';

interface BotCreatorProps {
  onClose: () => void;
  onCreate: (data: BotFormData) => void;
  bot?: Bot;
}

const AVAILABLE_COLORS = [
  'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500', 'bg-slate-600', 'bg-rose-500',
  'bg-emerald-600', 'bg-violet-600',
];

export const BotCreator: React.FC<BotCreatorProps> = ({ onClose, onCreate, bot }) => {
  const [formData, setFormData] = useState<BotFormData>(() => {
    if (bot) {
      return {
        name: bot.name,
        description: bot.description,
        systemInstruction: bot.systemInstruction,
        model: bot.model,
        avatarColor: bot.avatarColor,
        icon: bot.icon,
        avatarUrl: bot.avatarUrl,
        useSearch: bot.useSearch
      };
    }
    return {
      name: '',
      description: '',
      systemInstruction: '',
      model: ModelType.FLASH,
      avatarColor: AVAILABLE_COLORS[0],
      icon: ICONS_LIST[0],
      avatarUrl: undefined,
      useSearch: false
    };
  });

  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [activeIconCategory, setActiveIconCategory] = useState<string>('Tech');
  const [iconPage, setIconPage] = useState(0);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const ICONS_PER_PAGE = 18;

  const filteredIcons = (iconSearch.trim() !== '' 
    ? ICONS_LIST.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase()))
    : ICONS_CATEGORIES.find(c => c.name === activeIconCategory)?.icons || []
  );

  const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
  const paginatedIcons = filteredIcons.slice(iconPage * ICONS_PER_PAGE, (iconPage + 1) * ICONS_PER_PAGE);

  const handleIconSearchChange = (val: string) => {
    setIconSearch(val);
    setIconPage(0);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveIconCategory(cat);
    setIconSearch('');
    setIconPage(0);
  };

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

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) return;
    setIsGeneratingAvatar(true);
    try {
      const fullPrompt = `Circular profile avatar icon, ${avatarPrompt}, minimalist digital art, professional, centered, high quality, vector style, solid background compatible with ${formData.avatarColor}`;
      let imageUrl = await generateImage(fullPrompt);
      imageUrl = await compressImage(imageUrl, 512, 0.8);
      setFormData({ ...formData, avatarUrl: imageUrl });
    } catch (err) {
      console.error("Error generating avatar:", err);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const renderIcon = (iconName: string, size = 20) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Bot;
    return <IconComponent size={size} />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-blue-600 shadow-lg shadow-blue-900/20 w-10 h-10 flex items-center justify-center`}>
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Bot Avatar" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <BotIcon size={24} />
              )}
            </div>
            {bot ? 'Editar Bot' : 'Configurar Bot'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Icon & Color Section */}
              <div className="space-y-6">
                 <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Personalizar Avatar con IA</label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Describe el avatar..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-purple-500"
                          value={avatarPrompt}
                          onChange={(e) => setAvatarPrompt(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={handleGenerateAvatar}
                          disabled={isGeneratingAvatar || !avatarPrompt.trim()}
                          className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl transition-all disabled:opacity-50"
                        >
                          {isGeneratingAvatar ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        </button>
                      </div>
                      
                      {formData.avatarUrl && (
                        <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-xl">
                          <div className="flex items-center gap-3">
                            <img src={formData.avatarUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                            <span className="text-[10px] text-slate-400 font-medium">Avatar generado</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setFormData({ ...formData, avatarUrl: undefined })}
                            className="text-slate-500 hover:text-red-400 p-1.5"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                 </div>

                 <div className="flex justify-between items-end pt-2 border-t border-slate-800/50">
                    <label className="block text-sm font-semibold text-slate-300">O elige Icono y Color</label>
                    <div className="flex gap-1.5">
                      {AVAILABLE_COLORS.slice(0, 7).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarColor: color })}
                          className={`w-5 h-5 rounded-full ${color} transition-all ${formData.avatarColor === color ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                        />
                      ))}
                    </div>
                 </div>

                 <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                    <div className="p-3 border-b border-slate-800 bg-slate-900/30 flex items-center gap-2">
                       <Icons.Search size={14} className="text-slate-500" />
                       <input 
                         type="text" 
                         placeholder="Buscar icono..."
                         value={iconSearch}
                         onChange={(e) => handleIconSearchChange(e.target.value)}
                         className="bg-transparent text-xs text-white outline-none w-full"
                       />
                       {iconSearch && (
                         <button 
                           type="button" 
                           onClick={() => handleIconSearchChange('')}
                           className="text-slate-500 hover:text-white"
                         >
                           <Icons.XCircle size={14} />
                         </button>
                       )}
                    </div>
                    
                    {iconSearch.trim() === '' && (
                      <div className="flex overflow-x-auto p-1.5 gap-1 bg-slate-900/40 border-b border-slate-800 scrollbar-none scroll-smooth">
                        {ICONS_CATEGORIES.map((cat) => (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => handleCategoryChange(cat.name)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 uppercase tracking-wider ${
                              activeIconCategory === cat.name 
                                ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/50' 
                                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="h-40 overflow-y-auto p-3 grid grid-cols-6 gap-2 custom-scrollbar bg-slate-900/10">
                      {paginatedIcons.map((iconName) => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: iconName })}
                          className={`w-full aspect-square rounded-xl flex items-center justify-center border transition-all ${formData.icon === iconName ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-800'}`}
                        >
                          {renderIcon(iconName, 18)}
                        </button>
                      ))}
                      {paginatedIcons.length === 0 && (
                        <div className="col-span-6 py-8 text-center flex flex-col items-center gap-2">
                          <Icons.SearchX size={24} className="text-slate-700" />
                          <span className="text-xs text-slate-600 font-medium italic">No se encontraron iconos</span>
                        </div>
                      )}
                    </div>

                    {totalPages > 1 && (
                      <div className="px-3 py-2 border-t border-slate-800 flex justify-between items-center bg-slate-900/30">
                        <span className="text-[10px] text-slate-500 font-mono">
                          PÁGINA {iconPage + 1} DE {totalPages}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setIconPage(prev => Math.max(0, prev - 1))}
                            disabled={iconPage === 0}
                            className="bg-slate-800 text-slate-300 p-1 rounded-lg disabled:opacity-30 hover:bg-slate-700"
                          >
                            <Icons.ChevronLeft size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIconPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={iconPage === totalPages - 1}
                            className="bg-slate-800 text-slate-300 p-1 rounded-lg disabled:opacity-30 hover:bg-slate-700"
                          >
                            <Icons.ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
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
            <Save size={20} /> {bot ? 'Actualizar Bot' : 'Guardar Bot'}
          </button>
        </form>
      </div>
    </div>
  );
};
