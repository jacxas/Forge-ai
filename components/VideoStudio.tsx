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
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      <div className="p-8 border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
            <span className="p-2 bg-rose-600 rounded-2xl shadow-lg shadow-rose-600/20">
              <Film size={28} />
            </span>
            Video Studio
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Convierte tus ideas en conceptos cinemáticos de alta fidelidad.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-12 pb-24">
          
          {/* Input Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Video size={120} />
            </div>
            
            <div className="relative z-10">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Describe tu concepto de video</label>
              <div className="flex flex-col gap-4">
                <textarea 
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ej: Un astronauta caminando por un mercado de neón en Marte, estilo ciberpunk..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-lg text-white placeholder-slate-700 outline-none focus:ring-2 focus:ring-rose-500/50 transition-all resize-none h-32"
                />
                <button 
                  onClick={handleGenerate}
                  disabled={!concept.trim() || isGenerating}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                    isGenerating 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/20 active:scale-[0.98]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      Procesando Visión...
                    </>
                  ) : (
                    <>
                      <Zap size={24} fill="currentColor" />
                      Forjar Video
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
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {/* Left: Preview */}
                <div className="space-y-4">
                  <div className="aspect-video rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden shadow-2xl group">
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Video Preview" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                           <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">ENLACE CINEMÁTICO</span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
                             <PlayCircle size={32} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                         <Loader2 size={40} className="animate-spin text-rose-500" />
                         <span className="text-xs font-black uppercase tracking-widest text-slate-600">Generando Fotograma...</span>
                      </div>
                    )}
                  </div>
                  
                  {description && (
                    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 italic text-slate-400 text-sm leading-relaxed">
                      "{description}"
                    </div>
                  )}
                </div>

                {/* Right: Prompt Data */}
                <div className="space-y-6">
                   <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                      <div className="flex justify-between items-center mb-4">
                         <div className="flex items-center gap-2 text-rose-400">
                           <Sparkles size={16} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Prompt Cinemático IA</span>
                         </div>
                         <button 
                          onClick={() => {
                            if (enhancedPrompt) navigator.clipboard.writeText(enhancedPrompt);
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                         >
                           Copiar
                         </button>
                      </div>
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                         {enhancedPrompt || "Generando prompt optimizado..."}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center">
                         <Camera size={20} className="text-slate-500 mb-2" />
                         <span className="text-[10px] font-black uppercase text-slate-600">Resolución</span>
                         <span className="text-xs font-bold text-slate-300">4K Ultra HD</span>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center">
                         <RefreshCcw size={20} className="text-slate-500 mb-2" />
                         <span className="text-[10px] font-black uppercase text-slate-600">Estilo</span>
                         <span className="text-xs font-bold text-slate-300">Fotorrealista</span>
                      </div>
                   </div>

                   <button 
                    className="w-full py-4 border border-slate-800 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                   >
                     <Download size={16} />
                     Descargar Concepto Completo
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!enhancedPrompt && !isGenerating && (
             <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6 border border-slate-800 text-slate-700">
                   <Film size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Listo para la producción</h3>
                <p className="text-slate-500 max-w-sm">Define tu visión y deja que Forge AI cree la estructura técnica para tu próximo video.</p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};
