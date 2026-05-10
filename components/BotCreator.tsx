
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="glass border border-white/10 rounded-[3rem] w-full max-w-2xl shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col max-h-[95vh] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center glass-light relative">
          <h2 className="text-3xl font-black text-white flex items-center gap-5 font-display tracking-tight">
            <div className={`p-1 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-[0_10px_30px_rgba(37,99,235,0.3)] w-14 h-14 flex items-center justify-center relative overflow-hidden group/avatar`}>
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Bot Avatar" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <BotIcon size={28} className="text-white" />
              )}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
            </div>
            {bot ? 'REINVENTAR BOT' : 'FORJAR NUEVO BOT'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-all p-3 hover:bg-white/5 rounded-full rotate-0 hover:rotate-90">
            <X size={28} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-10 overflow-y-auto custom-scrollbar bg-transparent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Icon & Color Section */}
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Avatar Artificial</label>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          placeholder="Describe la apariencia..."
                          className="flex-1 glass-light border border-white/10 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                          value={avatarPrompt}
                          onChange={(e) => setAvatarPrompt(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={handleGenerateAvatar}
                          disabled={isGeneratingAvatar || !avatarPrompt.trim()}
                          className="bg-purple-600 hover:bg-purple-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl transition-all disabled:opacity-30 shadow-xl shadow-purple-600/20 active:scale-95"
                        >
                          {isGeneratingAvatar ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                        </button>
                      </div>
                      
                      {formData.avatarUrl && (
                        <div className="flex items-center justify-between p-3 glass-light border border-white/10 rounded-2xl animate-in slide-in-from-top-4">
                          <div className="flex items-center gap-4">
                            <img src={formData.avatarUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover shadow-2xl" />
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-white font-black uppercase tracking-widest">NUCLEO GENERADO</span>
                              <p className="text-[10px] text-slate-500 font-mono">512px • Vector-AI</p>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setFormData({ ...formData, avatarUrl: undefined })}
                            className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white p-2.5 rounded-xl transition-all"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                 </div>

                 <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cromatismo e Identidad</label>
                      <div className="flex gap-2">
                        {AVAILABLE_COLORS.slice(0, 6).map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, avatarColor: color })}
                            className={`w-4 h-4 rounded-full ${color} transition-all relative ${formData.avatarColor === color ? 'scale-125 shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-2 ring-white' : 'opacity-40 hover:opacity-100 hover:scale-110'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="glass-light border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative group focus-within:ring-2 focus-within:ring-blue-500/30 transition-all">
                      <div className="p-4 border-b border-white/5 glass-light flex items-center gap-3">
                         <Icons.Search size={16} className="text-slate-500" />
                         <input 
                           type="text" 
                           placeholder="Buscar iconografía..."
                           value={iconSearch}
                           onChange={(e) => handleIconSearchChange(e.target.value)}
                           className="bg-transparent text-sm text-white outline-none w-full placeholder:text-slate-600 font-medium"
                         />
                      </div>
                      
                      {iconSearch.trim() === '' && (
                        <div className="flex overflow-x-auto p-2 gap-2 glass-light border-b border-white/5 scrollbar-none">
                          {ICONS_CATEGORIES.map((cat) => (
                            <button
                              key={cat.name}
                              type="button"
                              onClick={() => handleCategoryChange(cat.name)}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all shrink-0 uppercase tracking-[0.2em] ${
                                activeIconCategory === cat.name 
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="h-44 overflow-y-auto p-4 grid grid-cols-6 gap-3 custom-scrollbar bg-white/[0.01]">
                        {paginatedIcons.map((iconName) => (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon: iconName })}
                            className={`w-full aspect-square rounded-[1.25rem] flex items-center justify-center border-2 transition-all group/icon ${formData.icon === iconName ? 'bg-blue-600 border-white text-white shadow-xl scale-105 z-10' : 'glass-light border-white/5 text-slate-500 hover:border-white/20 hover:text-white'}`}
                          >
                            {renderIcon(iconName, 22)}
                          </button>
                        ))}
                      </div>

                      {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-white/5 flex justify-between items-center glass-light">
                          <span className="text-[9px] text-slate-500 font-mono font-bold tracking-widest">
                            {iconPage + 1} / {totalPages}
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setIconPage(prev => Math.max(0, prev - 1))}
                              disabled={iconPage === 0}
                              className="w-8 h-8 flex items-center justify-center glass-light rounded-xl text-slate-400 hover:text-white disabled:opacity-20 border border-white/5"
                            >
                              <Icons.ChevronLeft size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setIconPage(prev => Math.min(totalPages - 1, prev + 1))}
                              disabled={iconPage === totalPages - 1}
                              className="w-8 h-8 flex items-center justify-center glass-light rounded-xl text-slate-400 hover:text-white disabled:opacity-20 border border-white/5"
                            >
                              <Icons.ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                 </div>
              </div>

             {/* Basic Info */}
             <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Denominación</label>
                  <input 
                    type="text" 
                    className="w-full glass-light border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-lg font-bold placeholder:text-slate-700"
                    placeholder="Escribe un nombre..."
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  {errors.name && <p className="text-red-400 text-[10px] mt-2 font-black uppercase tracking-widest ml-1">{errors.name}</p>}
                </div>
                
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Esencia</label>
                  <textarea 
                    className="w-full glass-light border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none h-32 resize-none leading-relaxed text-sm placeholder:text-slate-700"
                    placeholder="Describe el propósito de este bot..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                  {errors.description && <p className="text-red-400 text-[10px] mt-2 font-black uppercase tracking-widest ml-1">{errors.description}</p>}
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Configuración Cuántica</label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-5 glass-light rounded-2xl border border-white/10 group hover:border-white/20 transition-all">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/10">
                           <Globe size={20} />
                         </div>
                         <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">Search Grounding</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Sincronización web en tiempo real.</p>
                         </div>
                       </div>
                       <button 
                        type="button"
                        onClick={() => setFormData({...formData, useSearch: !formData.useSearch})}
                        className={`w-14 h-7 rounded-full transition-all relative border-2 ${formData.useSearch ? 'bg-blue-600 border-white/10' : 'bg-white/5 border-white/5'}`}
                       >
                         <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xl transition-all duration-300 ${formData.useSearch ? 'right-0.5' : 'left-0.5'}`} />
                       </button>
                    </div>

                    <div className="space-y-2">
                      <select 
                        className="w-full glass-light border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none cursor-pointer text-sm font-bold appearance-none bg-no-repeat bg-[right_1.5rem_center]"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0\' stroke=\'white\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")' }}
                        value={formData.model}
                        onChange={e => setFormData({...formData, model: e.target.value as ModelType})}
                      >
                         <option value={ModelType.FLASH}>NEURON: FLASH 3.0</option>
                         <option value={ModelType.FLASH_LITE}>NEURON: LITE PROTOCOL</option>
                         <option value={ModelType.PRO}>NEURON: ADVANCED PRO</option>
                         <option value={ModelType.IMAGE}>NEURON: VISUAL SYNTH</option>
                      </select>
                    </div>
                  </div>
                </div>
             </div>
          </div>

          <div className="pt-6">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Parámetros de Conducta</label>
            <textarea 
              className="w-full glass-light border border-white/10 rounded-3xl px-6 py-5 text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none h-44 resize-none font-mono text-[11px] leading-relaxed placeholder:text-slate-700"
              placeholder="Inyecta instrucciones maestras aquí..."
              value={formData.systemInstruction}
              onChange={e => setFormData({...formData, systemInstruction: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] text-white text-base font-black py-6 rounded-[2rem] transition-all flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(37,99,235,0.35)] uppercase tracking-[0.3em]"
          >
            <Save size={24} /> {bot ? 'MODIFICAR ESTRUCTURA' : 'FORJAR ENTIDAD'}
          </button>
        </form>
      </div>
    </div>
  );
};
