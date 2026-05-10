import React, { useState } from 'react';
import { Video, Sparkles, Send, Loader2, PlayCircle, Film, Camera, Zap, Download, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { streamResponse, generateImage } from '../services/geminiService';
import { ModelType } from '../types';
import { compressImage } from '../lib/imageUtils';

export const VideoStudio: React.FC = () => {
  const [concept, setConcept] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!concept.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setPreviewUrl(null);
    setEnhancedPrompt(null);
    setDescription(null);

    try {
      // 1. Generate cinematic prompt and description using Pro model
      const systemPrompt = `Eres un Director de Fotografía e Ingeniero de Prompts cinemáticos experto.
      Recibirás un concepto de video y debes:
      1. Crear un PROMPT CINEMÁTICO TÉCNICO (en inglés, optimizado para Sora, Runway Gen-2, Pika).
      2. Narrar una breve DESCRIPCIÓN ATMOSFÉRICA de lo que veríamos en el video (en español).
      
      Responde en formato JSON:
      {
        "prompt": "técnico, descriptivo, inglés...",
        "description": "atmósfera, narrativa, español..."
      }`;

      let content = '';
      await streamResponse(
        ModelType.PRO,
        systemPrompt,
        [],
        `Concepto: ${concept}`,
        false,
        null,
        (chunk) => { content += chunk; },
        async () => {}
      );

      // Clean content from potential markdown blocks
      const cleanJson = content.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanJson);
      
      setEnhancedPrompt(result.prompt);
      setDescription(result.description);

      // 2. Generate a visual preview frame
      const visualPrompt = `Cinematic absolute high quality movie frame still, hyperrealistic, 4k, film grain, photorealistic: ${result.prompt}`;
      const rawImage = await generateImage(visualPrompt);
      const optimizedImage = await compressImage(rawImage, 1024, 0.7);
      setPreviewUrl(optimizedImage);

    } catch (err) {
      console.error("Error in Video Studio:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-transparent overflow-hidden">
      <div className="p-10 border-b border-white/5 glass backdrop-blur-3xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-black text-white tracking-tighter flex items-center gap-6 font-display">
            <span className="p-4 bg-gradient-to-br from-rose-600 to-orange-600 rounded-[2rem] shadow-[0_20px_50px_rgba(225,29,72,0.3)]">
              <Film size={36} />
            </span>
            SÍNTESIS CINÉTICA
          </h1>
          <p className="text-slate-400 mt-4 text-xl font-light leading-relaxed">
            Convierte tus ideas en cine en segundos. Transforma visiones abstractas en realidades de alta fidelidad y desbloquea el poder del hiperrealismo absoluto.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 md:p-14 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-16 pb-32">
          
          {/* Input Section */}
          <div className="glass-light border border-white/10 rounded-[3rem] p-10 shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <Video size={160} />
            </div>
            
            <div className="relative z-10 space-y-8">
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Mapeo de Concepto</label>
              <div className="space-y-6">
                <textarea 
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ej: Un astronauta errante en mercados de neón marcianos, estética hiper-vanguardista..."
                  className="w-full bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 text-xl text-white placeholder-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all resize-none h-40 font-light"
                />
                <button 
                  onClick={handleGenerate}
                  disabled={!concept.trim() || isGenerating}
                  className={`w-full py-6 rounded-[2.5rem] text-base font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-2xl ${
                    isGenerating 
                      ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5' 
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      SINCRONIZANDO VISIÓN...
                    </>
                  ) : (
                    <>
                      <Zap size={24} fill="currentColor" />
                      FORJAR CONCEPTO
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <AnimatePresence>
            {(enhancedPrompt || previewUrl) && (
              <motion.div 
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-12"
              >
                {/* Left: Preview */}
                <div className="space-y-6">
                  <div className="aspect-video rounded-[3rem] glass border border-white/10 relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] group">
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Video Preview" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[3s]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        <div className="absolute top-8 left-8 flex items-center gap-3">
                           <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                           <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] font-mono">SIMULACIÓN LVL 01</span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full glass border border-white/20 flex items-center justify-center text-white cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-2xl">
                             <PlayCircle size={48} strokeWidth={1} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                         <div className="w-20 h-20 rounded-full glass-light flex items-center justify-center border border-white/5">
                            <Loader2 size={32} className="animate-spin text-rose-500" />
                         </div>
                         <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">PRODUCIENDO FOTOGRAMA...</span>
                      </div>
                    )}
                  </div>
                  
                  {description && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="glass-light border border-white/5 rounded-[2rem] p-8 text-slate-400 text-lg leading-relaxed font-light italic"
                    >
                      "{description}"
                    </motion.div>
                  )}
                </div>

                {/* Right: Prompt Data */}
                <div className="space-y-8">
                   <div className="glass border border-white/10 rounded-[3rem] p-8 shadow-2xl">
                      <div className="flex justify-between items-center mb-6">
                         <div className="flex items-center gap-3 text-rose-400">
                           <Sparkles size={18} />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em]">CÓDIGO CINEMÁTICO</span>
                         </div>
                         <button 
                          onClick={() => {
                            if (enhancedPrompt) navigator.clipboard.writeText(enhancedPrompt);
                          }}
                          className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-all border border-white/5"
                         >
                           COPIAR
                         </button>
                      </div>
                      <div className="bg-black/40 rounded-3xl p-6 border border-white/10 font-mono text-xs text-slate-300 leading-relaxed max-h-72 overflow-y-auto custom-scrollbar">
                         {enhancedPrompt || "Sincronizando metadatos de prompt..."}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="glass-light border border-white/5 rounded-[2rem] p-6 flex flex-col items-center text-center group hover:bg-white/5 transition-all">
                         <Camera size={24} className="text-slate-500 mb-3 transition-transform group-hover:scale-110" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">RANGO</span>
                         <span className="text-sm font-bold text-white tracking-tight leading-none">8K NATIVE</span>
                      </div>
                      <div className="glass-light border border-white/5 rounded-[2rem] p-6 flex flex-col items-center text-center group hover:bg-white/5 transition-all">
                         <RefreshCcw size={24} className="text-slate-500 mb-3 transition-transform group-hover:rotate-180 duration-1000" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">PROCESO</span>
                         <span className="text-sm font-bold text-white tracking-tight leading-none">NEURAL HDR</span>
                      </div>
                   </div>

                   <button 
                    className="w-full py-6 glass-light border border-white/10 rounded-[2.5rem] text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95"
                   >
                     <Download size={20} />
                     DESCARGAR PROYECTO
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!enhancedPrompt && !isGenerating && (
             <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-1000 slide-in-from-bottom-8">
                <div className="w-32 h-32 rounded-[3.5rem] glass flex items-center justify-center mb-10 border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                   <Film size={48} className="text-slate-700" />
                </div>
                <h3 className="text-4xl font-black text-white mb-4 font-display tracking-tight uppercase">STUDIO READY</h3>
                <p className="text-slate-500 max-w-sm text-xl font-light leading-relaxed">
                  Configura tu visión creativa y deja que Forge materialice los parámetros técnicos.
                </p>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px] -z-10"></div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};
