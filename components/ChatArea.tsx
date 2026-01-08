
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, Paperclip, RotateCcw, Bot as BotIcon, Globe, 
  ExternalLink, Image as ImageIcon, Loader2, Volume2, 
  VolumeX, PlayCircle, BrainCircuit, Sparkles, X, Camera
} from 'lucide-react';
import { Message, Bot, ModelType } from '../types';
import * as Icons from 'lucide-react';
import { textToSpeech } from '../services/geminiService';

interface ChatAreaProps {
  activeBot: Bot;
  messages: Message[];
  onSendMessage: (text: string, image?: { data: string; mimeType: string }) => void;
  isStreaming: boolean;
  onClearHistory: () => void;
  onRegenerate: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ 
  activeBot, 
  messages, 
  onSendMessage, 
  isStreaming,
  onClearHistory,
  onRegenerate
}) => {
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setAttachedImage({
          data: base64Data,
          mimeType: file.type,
          preview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const handlePlayVoice = async (message: Message) => {
    if (loadingAudioId || playingAudioId) return;
    setLoadingAudioId(message.id);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const base64Audio = await textToSpeech(message.content);
      const audioData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setPlayingAudioId(null);
      setPlayingAudioId(message.id);
      setLoadingAudioId(null);
      source.start();
    } catch (error) {
      console.error(error);
      setLoadingAudioId(null);
      setPlayingAudioId(null);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachedImage) || isStreaming) return;
    onSendMessage(input, attachedImage ? { data: attachedImage.data, mimeType: attachedImage.mimeType } : undefined);
    setInput('');
    setAttachedImage(null);
    if (textareaRef.current) textareaRef.current.style.height = 'inherit';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderIcon = (iconName: string, size = 18) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Bot;
    return <IconComponent size={size} />;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/90 backdrop-blur z-10">
        <div className="flex items-center gap-3">
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${activeBot.avatarColor}`}>
             {renderIcon(activeBot.icon)}
           </div>
           <div>
             <h2 className="font-bold text-white leading-tight">{activeBot.name}</h2>
             <div className="flex items-center gap-2">
               <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                 {activeBot.model.split('-')[1] || 'AI'}
               </span>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button 
              onClick={onRegenerate}
              disabled={isStreaming}
              className="text-slate-500 hover:text-blue-400 transition-all p-2 rounded-full hover:bg-slate-900 disabled:opacity-30"
              title="Regenerar última respuesta"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <button 
            onClick={onClearHistory}
            className="text-slate-500 hover:text-red-400 transition-all p-2 rounded-full hover:bg-slate-900"
            title="Limpiar historial"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className={`w-24 h-24 rounded-3xl mb-8 flex items-center justify-center text-white shadow-2xl ${activeBot.avatarColor} animate-pulse`}>
              {renderIcon(activeBot.icon, 48)}
            </div>
            <h3 className="text-4xl font-black text-white mb-3 tracking-tight">PoeClone Premium</h3>
            <p className="text-slate-400 max-w-md text-lg leading-relaxed">{activeBot.description}</p>
            <div className="mt-8 flex gap-3 flex-wrap justify-center">
              <span className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-xs font-medium flex items-center gap-2">
                <Camera size={12} /> Análisis de Imágenes
              </span>
              <span className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-xs font-medium flex items-center gap-2">
                <BrainCircuit size={12} /> Razonamiento Avanzado
              </span>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md ${msg.role === 'user' ? 'bg-slate-700' : activeBot.avatarColor}`}>
                {msg.role === 'user' ? <span className="text-sm font-bold">U</span> : renderIcon(activeBot.icon, 20)}
              </div>

              <div className={`max-w-[85%] md:max-w-[75%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.attachedImage && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mb-1 max-w-[200px]">
                    <img src={`data:${msg.attachedImage.mimeType};base64,${msg.attachedImage.data}`} alt="Adjunto" className="w-full h-auto opacity-80" />
                  </div>
                )}
                
                <div className={`rounded-2xl px-5 py-3.5 leading-relaxed shadow-sm relative group/msg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-200'}`}>
                  {msg.role === 'model' && !msg.isImage && (
                    <button 
                      onClick={() => handlePlayVoice(msg)}
                      className={`absolute -right-10 top-2 p-2 rounded-lg transition-all opacity-0 group-hover/msg:opacity-100 ${playingAudioId === msg.id ? 'text-blue-400 animate-pulse' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    >
                      {loadingAudioId === msg.id ? <Loader2 size={16} className="animate-spin" /> : playingAudioId === msg.id ? <Volume2 size={16} /> : <PlayCircle size={16} />}
                    </button>
                  )}

                  {msg.isImage ? (
                    <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950"><img src={msg.imageUrl} alt="AI Art" className="w-full h-auto" /></div>
                  ) : (
                    <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{msg.content}</ReactMarkdown>
                  )}
                </div>

                {msg.groundingChunks && (
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingChunks.map((chunk, idx) => chunk.web && (
                      <a key={idx} href={chunk.web.uri} target="_blank" className="text-[10px] px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center gap-1"><Globe size={10} /> {chunk.web.title}</a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isStreaming && (
          <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
             <div className={`w-9 h-9 rounded-xl ${activeBot.avatarColor} flex items-center justify-center`}>
               <BrainCircuit className="text-white animate-pulse" size={20} />
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-slate-400 text-sm flex items-center gap-3">
               <Loader2 className="animate-spin text-blue-500" size={14} />
               <span>{activeBot.name} está analizando tu petición...</span>
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-4">
          {attachedImage && (
            <div className="flex items-center gap-3 animate-in slide-in-from-bottom-4">
              <div className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg shadow-blue-500/20">
                <img src={attachedImage.preview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setAttachedImage(null)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              <div className="text-xs text-slate-500 font-medium">Imagen lista para analizar</div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-700 rounded-2xl flex items-end p-2 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-2xl shadow-black/50">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-500 hover:text-white transition-colors rounded-xl hover:bg-slate-800 h-11 w-11 flex items-center justify-center shrink-0"
              title="Adjuntar imagen"
            >
              <ImageIcon size={20} />
            </button>
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachedImage ? "¿Qué quieres saber de esta imagen?" : `Mensaje a ${activeBot.name}...`}
              className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-600 resize-none py-2.5 px-3 min-h-[44px] max-h-[150px]"
              rows={1}
            />
            <button 
              onClick={() => handleSubmit()}
              disabled={(!input.trim() && !attachedImage) || isStreaming}
              className={`p-2.5 rounded-xl transition-all transform active:scale-90 ${ (input.trim() || attachedImage) && !isStreaming ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-600'}`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
