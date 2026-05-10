
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Send, Paperclip, RotateCcw, Bot as BotIcon, Globe, 
  ExternalLink, Image as ImageIcon, Loader2, Volume2, 
  VolumeX, PlayCircle, BrainCircuit, Sparkles, X, Camera,
  Mic, MicOff, Copy, Check, Trash2, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, Bot, ModelType } from '../types';
import * as Icons from 'lucide-react';
import { textToSpeech, enhancePrompt } from '../services/geminiService';
import { BotDetails } from './BotDetails';

interface ChatAreaProps {
  activeBot: Bot;
  messages: Message[];
  onSendMessage: (text: string, image?: { data: string; mimeType: string }) => void;
  isStreaming: boolean;
  onClearHistory: () => void;
  onRegenerate: () => void;
  onDeleteMessage: (id: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ 
  activeBot, 
  messages, 
  onSendMessage, 
  isStreaming,
  onClearHistory,
  onRegenerate,
  onDeleteMessage
}) => {
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showBotDetails, setShowBotDetails] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isDragging, setIsDragging] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);

  const filteredMessages = searchTerm 
    ? messages.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInput(prev => {
            const lastChar = prev.trim().slice(-1);
            const needsSpace = prev.length > 0 && lastChar !== '' && !['.', '!', '?'].includes(lastChar);
            return prev + (needsSpace ? ' ' : '') + finalTranscript;
          });
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert("Acceso al micrófono denegado.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 300);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportMarkdown = () => {
    const content = messages.map(m => {
      const role = m.role === 'user' ? '### Usuario' : `### ${activeBot.name}`;
      return `${role}\n\n${m.content}\n\n---`;
    }).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${activeBot.name}_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleFile = (file: File | null | undefined) => {
    if (file && file.type.startsWith('image/')) {
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

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        handleFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const startCamera = async (forceFacingMode?: 'user' | 'environment') => {
    if (showCamera && !forceFacingMode) {
      stopCamera();
      return;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    const mode = forceFacingMode || facingMode;

    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(s);
      setFacingMode(mode);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      } else {
        setTimeout(() => {
          if (videoRef.current) videoRef.current.srcObject = s;
        }, 100);
      }
    } catch (err: any) {
      console.error("Camera access denied or error:", err);
      if (err.name === 'NotAllowedError') {
        alert("Permiso de cámara denegado. Por favor, habilítalo en la configuración de tu navegador.");
      } else {
        alert("No se pudo acceder a la cámara. Revisa las conexiones.");
      }
      setShowCamera(false);
    }
  };

  const toggleCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      setIsCapturing(true);
      
      // Visual flash delay
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current!.videoWidth;
        canvas.height = videoRef.current!.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // If using front camera, mirror the capture to match preview
          if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(videoRef.current!, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const base64Data = dataUrl.split(',')[1];
          setAttachedImage({
            data: base64Data,
            mimeType: 'image/jpeg',
            preview: dataUrl
          });
          stopCamera();
          setIsCapturing(false);
        }
      }, 150);
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

  const handleEnhance = async () => {
    if (!input.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      let type: 'image' | 'video' | 'general' = 'general';
      if (activeBot.id === 'bot-artist') type = 'image';
      if (activeBot.id === 'bot-video') type = 'video';
      
      const enhanced = await enhancePrompt(input, type);
      setInput(enhanced);
    } catch (err) {
      console.error("Error enhancing prompt:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const renderIcon = (iconName: string, size = 18) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Bot;
    return <IconComponent size={size} />;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden font-sans">
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 glass-light backdrop-blur-2xl z-20 sticky top-0">
        <button 
          onClick={() => setShowBotDetails(true)}
          className="flex items-center gap-4 hover:bg-white/5 p-2 pr-6 rounded-[2rem] transition-all group text-left border border-transparent hover:border-white/5 active:scale-95"
        >
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl ${activeBot.avatarColor} group-hover:scale-105 transition-all duration-500 overflow-hidden relative`}>
             {activeBot.avatarUrl ? (
               <img src={activeBot.avatarUrl} alt={activeBot.name} className="w-full h-full object-cover" />
             ) : (
               renderIcon(activeBot.icon, 24)
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
           </div>
           <div>
             <h2 className="font-black text-white leading-tight flex items-center gap-2 text-lg tracking-tight font-display">
               {activeBot.name}
               <Icons.ChevronDown size={14} className="text-slate-500 group-hover:text-white transition-colors" />
             </h2>
             <div className="flex items-center gap-2">
               <span className="text-[9px] bg-white/10 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full font-mono uppercase tracking-[0.2em] font-black">
                 {activeBot.model.split('-')[1] || 'PREMIUM'}
               </span>
               <div className="flex gap-0.5">
                 {[0, 1, 2].map(i => (
                   <div key={i} className="w-1 h-1 rounded-full bg-green-500/40"></div>
                 ))}
               </div>
             </div>
           </div>
        </button>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {showSearch && (
              <motion.div 
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Explorar historial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 text-sm rounded-2xl px-5 py-2.5 w-48 md:w-64 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600"
                  autoFocus
                />
                <button 
                  onClick={() => { setSearchTerm(''); setShowSearch(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center glass p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2.5 rounded-xl transition-all ${showSearch ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              title="Buscar"
            >
              <Icons.Search size={18} />
            </button>

            <button 
              onClick={handleExportMarkdown}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              title="Exportar"
            >
              <Icons.Download size={18} />
            </button>

            {messages.length > 0 && (
              <button 
                onClick={onRegenerate}
                disabled={isStreaming}
                className="text-slate-400 hover:text-blue-400 transition-all p-2.5 rounded-xl hover:bg-white/5 disabled:opacity-30"
                title="Regenerar"
              >
                <RotateCcw size={18} />
              </button>
            )}
            
            <button 
              onClick={onClearHistory}
              className="text-slate-400 hover:text-red-400 transition-all p-2.5 rounded-xl hover:bg-white/5"
              title="Limpiar"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </header>

      <div 
        className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar relative ${isDragging ? 'bg-blue-600/10' : ''}`}
        onScroll={handleScroll}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        ref={chatContainerRef}
      >
        {isDragging && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-blue-600/20 backdrop-blur-[2px] pointer-events-none">
            <div className="bg-blue-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <ImageIcon size={32} />
              </div>
              <p className="text-xl font-black uppercase tracking-wider">Suelta para adjuntar</p>
            </div>
          </div>
        )}
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`w-32 h-32 rounded-[2.5rem] mb-10 flex items-center justify-center text-white shadow-[0_0_50px_rgba(59,130,246,0.3)] bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-500 relative z-10`}
            >
              {renderIcon(activeBot.icon, 56)}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-white rounded-full blur-3xl -z-10"
              />
            </motion.div>
            
            <h3 className="text-6xl font-black text-white mb-6 tracking-tighter font-display">
              {searchTerm ? "SIN RESULTADOS" : activeBot.name.toUpperCase()}
            </h3>
            <p className="text-slate-400 max-w-xl text-xl leading-relaxed font-light mb-12">
              {searchTerm ? `No encontramos huellas de "${searchTerm}" en este universo.` : activeBot.description}
            </p>
            
            {!searchTerm && (
              <div className="flex gap-4 flex-wrap justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {[
                  { icon: <Camera size={14} />, label: "VISIÓN PRO" },
                  { icon: <BrainCircuit size={14} />, label: "PENSAMIENTO PROFUNDO" },
                  { icon: <Sparkles size={14} />, label: "CREATIVIDAD" }
                ].map((tag, i) => (
                  <span key={i} className="px-6 py-2.5 rounded-2xl glass-light text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border border-white/5 hover:border-white/10 transition-all cursor-default scale-100 hover:scale-105 active:scale-95">
                    <span className="text-blue-400">{tag.icon}</span>
                    {tag.label}
                  </span>
                ))}
              </div>
            )}
            
            {/* Background elements for impact */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] -z-0"></div>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md overflow-hidden ${msg.role === 'user' ? 'bg-slate-700' : activeBot.avatarColor}`}>
                {msg.role === 'user' ? (
                  <span className="text-sm font-bold">U</span>
                ) : activeBot.avatarUrl ? (
                  <img src={activeBot.avatarUrl} alt={activeBot.name} className="w-full h-full object-cover" />
                ) : (
                  renderIcon(activeBot.icon, 20)
                )}
              </div>

              <div className={`max-w-[85%] md:max-w-[75%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.attachedImage && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mb-1 max-w-[200px]">
                    <img src={`data:${msg.attachedImage.mimeType};base64,${msg.attachedImage.data}`} alt="Adjunto" className="w-full h-auto opacity-80" />
                  </div>
                )}
                
                <div className={`rounded-[2rem] px-7 py-5 leading-relaxed shadow-2xl relative group/msg transition-all duration-300 ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-medium scale-100 hover:scale-[1.01]' : 'glass-light border border-white/5 text-slate-200'}`}>
                  {/* Actions bar */}
                  <div className={`absolute top-2 flex gap-1 opacity-0 group-hover/msg:opacity-100 transition-all duration-300 ${msg.role === 'user' ? '-left-24' : '-right-24'}`}>
                    <button 
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="p-2.5 rounded-xl glass-light border border-white/10 text-slate-400 hover:text-white"
                      title="Copiar"
                    >
                      {copiedId === msg.id ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                    {msg.role === 'model' && !msg.isImage && (
                      <button 
                        onClick={() => handlePlayVoice(msg)}
                        className={`p-2.5 rounded-xl glass-light border border-white/10 transition-all ${playingAudioId === msg.id ? 'text-blue-400 animate-pulse' : 'text-slate-400 hover:text-white'}`}
                        title="Reproducir voz"
                      >
                        {loadingAudioId === msg.id ? <Loader2 size={16} className="animate-spin" /> : playingAudioId === msg.id ? <Volume2 size={16} /> : <Volume2 size={16} />}
                      </button>
                    )}
                    <button 
                      onClick={() => onDeleteMessage(msg.id)}
                      className="p-2.5 rounded-xl glass-light border border-white/10 text-slate-400 hover:text-red-400"
                      title="Borrar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {msg.isImage ? (
                    <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                      <img src={msg.imageUrl} alt="AI Art" className="w-full h-auto" />
                    </div>
                  ) : msg.botId === 'bot-video' && msg.role === 'model' ? (
                    <div className="space-y-4">
                      <div className="aspect-video rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group">
                        {/* Generated Thumbnail as Video Background */}
                        {msg.imageUrl ? (
                          <img 
                            src={msg.imageUrl} 
                            alt="Video Frame" 
                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950" />
                        )}

                        {/* Simulated Cinematic Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                           <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest font-bold drop-shadow-md">REC • 4K</span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform cursor-pointer shadow-2xl">
                            <PlayCircle size={32} />
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 text-[10px] font-mono text-white/50 flex justify-between z-10">
                           <span className="drop-shadow-md">00:00:12:04</span>
                           <span className="drop-shadow-md">FORGE_CINEMA_GEN_PREVIEW</span>
                        </div>
                        {/* Background mesh/grain for cinematic feel */}
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0" />
                      </div>
                      
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown 
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus as any}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-lg !bg-slate-950 !my-4 select-text"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={`${className} bg-slate-800 px-1 rounded text-blue-300 font-mono`} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown 
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus as any}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-lg !bg-slate-950 !my-4 select-text"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={`${className} bg-slate-800 px-1 rounded text-blue-300 font-mono`} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
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
        <AnimatePresence>
          {isStreaming && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex gap-4"
            >
               <div className={`w-9 h-9 rounded-xl ${activeBot.avatarColor} flex items-center justify-center shadow-lg relative overflow-hidden`}>
                 {activeBot.avatarUrl ? (
                   <img src={activeBot.avatarUrl} alt={activeBot.name} className="w-full h-full object-cover" />
                 ) : activeBot.model === ModelType.PRO ? (
                   <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                     <motion.div 
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.2, 1],
                        }}
                        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        className="absolute inset-0 opacity-20 bg-[conic-gradient(from_0deg,#6366f1,#a855f7,#ec4899,#6366f1)]"
                     />
                     <BrainCircuit className="text-indigo-400 relative z-10" size={20} />
                   </div>
                 ) : (
                   <div className="relative w-full h-full flex items-center justify-center">
                     <BrainCircuit className="text-white animate-pulse" size={20} />
                   </div>
                 )}
               </div>
               
               <div className={`rounded-2xl px-5 py-4 text-sm flex flex-col gap-3 shadow-2xl transition-all duration-500 ${
                 activeBot.model === ModelType.PRO 
                   ? 'bg-slate-900/50 backdrop-blur-xl border border-indigo-500/30 text-indigo-100 min-w-[300px]' 
                   : 'bg-slate-900 border border-slate-800 text-slate-400'
               }`}>
                 {activeBot.model === ModelType.PRO ? (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <div className="flex gap-1">
                           {[0, 1, 2].map((i) => (
                             <motion.span
                               key={i}
                               animate={{ 
                                 opacity: [0.3, 1, 0.3],
                                 scale: [0.8, 1.2, 0.8]
                               }}
                               transition={{ 
                                 repeat: Infinity, 
                                 duration: 1, 
                                 delay: i * 0.2 
                               }}
                               className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                             />
                           ))}
                         </div>
                         <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80">Modo Pensamiento</span>
                       </div>
                       <motion.div
                         animate={{ rotate: 360 }}
                         transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                       >
                         <Icons.Settings size={12} className="text-indigo-500/50" />
                       </motion.div>
                     </div>

                     <div className="flex items-start gap-4">
                       <div className="relative shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full border border-indigo-500/20 flex items-center justify-center">
                            <motion.div
                              animate={{ 
                                scale: [1, 1.3, 1],
                                opacity: [0.5, 0.8, 0.5]
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 bg-indigo-500/10 rounded-full"
                            />
                            <Zap size={14} className="text-indigo-400" />
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-1">
                         <h4 className="text-sm font-bold text-white flex items-center gap-2">
                           {activeBot.name} 
                           <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono border border-indigo-500/20">GEMINI 3 PRO</span>
                         </h4>
                         <p className="text-xs text-indigo-300/70 leading-relaxed max-w-[240px]">
                           <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="font-black text-indigo-400">RAZONANDO...</motion.span> Analizando variables complejas y sintetizando una respuesta de alta precisión...
                         </p>
                       </div>
                     </div>

                     {/* Simulated thinking bars */}
                     <div className="space-y-1.5 pt-1">
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                          />
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="h-full w-1/2 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                          />
                        </div>
                     </div>
                   </div>
                 ) : (
                   <div className="flex items-center gap-3">
                     <Loader2 className="animate-spin text-blue-500" size={14} />
                     <span>{activeBot.name} está analizando tu petición...</span>
                   </div>
                 )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {showScrollBottom && (
        <button 
          onClick={scrollToBottom}
          className="absolute bottom-32 right-8 p-3 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-all z-20 animate-in fade-in zoom-in"
        >
          <Icons.ArrowDown size={20} />
        </button>
      )}

      <div className="p-6 bg-transparent relative z-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {showCamera && (
            <div className="relative rounded-[3rem] overflow-hidden bg-black aspect-video animate-in zoom-in-95 duration-500 shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 group">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              
              {/* Flash Effect */}
              {isCapturing && (
                <div className="absolute inset-0 bg-white animate-out fade-out duration-300 z-50" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              {/* Camera Header Info */}
              <div className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2 rounded-2xl glass-light border border-white/10 text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Feed: {facingMode === 'user' ? 'Front' : 'Back'} Sensors
              </div>

              <div className="absolute inset-x-0 bottom-10 flex justify-center items-center gap-8">
                <button 
                  onClick={stopCamera}
                  className="w-16 h-16 rounded-full glass flex items-center justify-center text-white shadow-2xl hover:bg-white/10 active:scale-90 transition-all border border-white/5"
                  title="Cerrar"
                >
                  <X size={28} />
                </button>

                <button 
                  onClick={capturePhoto}
                  className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:scale-110 active:scale-95 transition-all border-[8px] border-white/20 group/shutter"
                  title="Capturar"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-slate-900/5 flex items-center justify-center group-hover/shutter:bg-slate-50 transition-colors">
                    <Camera size={36} strokeWidth={2.5} />
                  </div>
                </button>

                <button 
                  onClick={toggleCamera}
                  className="w-16 h-16 rounded-full glass flex items-center justify-center text-white shadow-2xl hover:bg-white/10 active:scale-90 transition-all border border-white/5"
                  title="Cambiar"
                >
                  <Icons.RefreshCw size={28} />
                </button>
              </div>
            </div>
          )}

          <div className="glass-light border border-white/10 rounded-[2.5rem] flex items-end p-2.5 focus-within:border-blue-500/50 focus-within:ring-[12px] focus-within:ring-blue-500/5 transition-all shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            
            <div className="flex bg-white/5 p-1 rounded-[1.8rem] border border-white/5">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-white transition-all rounded-[1.4rem] hover:bg-white/5 h-12 w-12 flex items-center justify-center shrink-0"
                title="Imagen"
              >
                <ImageIcon size={20} />
              </button>

              <button 
                onClick={() => startCamera()}
                className={`p-3 transition-all rounded-[1.4rem] h-12 w-12 flex items-center justify-center shrink-0 ${showCamera ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                title="Sensores"
              >
                <Camera size={20} />
              </button>

              <button 
                onClick={toggleListening}
                className={`p-3 transition-all rounded-[1.4rem] h-12 w-12 flex items-center justify-center shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-xl shadow-red-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                title="Dictar"
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            </div>
            
            <div className="flex-1 flex flex-col mx-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={attachedImage ? "¿Analizar esta imagen?" : `Escribe a ${activeBot.name}...`}
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-600 resize-none py-3 px-4 min-h-[50px] max-h-[180px] text-base"
                rows={1}
              />
              
              <AnimatePresence>
                {attachedImage && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-5 px-4 py-4 border-t border-white/5 mt-2 bg-white/[0.02] rounded-3xl mx-2 mb-2">
                      <div className="relative group shrink-0">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-blue-500/40 shadow-2xl bg-slate-950">
                          <img src={attachedImage.preview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <button 
                          onClick={() => setAttachedImage(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-xl hover:bg-red-600 transition-all border-2 border-slate-950 z-10 scale-100 hover:scale-110 active:scale-90"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] inline-flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          INPUT VISUAL LISTO
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono tracking-widest">
                          {attachedImage.mimeType.split('/')[1].toUpperCase()} • {(attachedImage.data.length * 0.75 / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex bg-white/5 p-1 rounded-[1.8rem] border border-white/5 items-center">
              <button 
                onClick={handleEnhance}
                disabled={!input.trim() || isEnhancing || isStreaming}
                className={`p-3 transition-all rounded-[1.4rem] h-12 w-12 flex items-center justify-center shrink-0 relative group/enhance ${
                  isEnhancing 
                    ? 'bg-purple-600 text-white animate-pulse shadow-xl shadow-purple-600/30' 
                    : 'text-slate-400 hover:text-purple-400 hover:bg-white/5'
                }`}
                title="Optimizar"
              >
                {isEnhancing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={20} className={input.trim() && (activeBot.id === 'bot-artist' || activeBot.id === 'bot-video') ? 'animate-pulse' : ''} />
                    {input.trim() && (activeBot.id === 'bot-artist' || activeBot.id === 'bot-video') && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                      </span>
                    )}
                  </>
                )}
              </button>
              
              <button 
                onClick={() => handleSubmit()}
                disabled={(!input.trim() && !attachedImage) || isStreaming}
                className={`p-3 transition-all rounded-full h-12 w-12 flex items-center justify-center shrink-0 ${
                  (!input.trim() && !attachedImage) || isStreaming
                    ? 'text-slate-600 opacity-50'
                    : 'bg-white text-black shadow-xl hover:scale-105 active:scale-95'
                }`}
              >
                {isStreaming ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <Send size={20} className="translate-x-0.5 -translate-y-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <BotDetails 
        bot={activeBot} 
        isOpen={showBotDetails} 
        onClose={() => setShowBotDetails(false)} 
      />
    </div>
  );
};
