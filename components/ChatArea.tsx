
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
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/90 backdrop-blur z-10 sticky top-0">
        <button 
          onClick={() => setShowBotDetails(true)}
          className="flex items-center gap-3 hover:bg-slate-900/50 p-1.5 pr-4 rounded-2xl transition-colors group text-left"
        >
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${activeBot.avatarColor} group-hover:scale-105 transition-transform overflow-hidden`}>
             {activeBot.avatarUrl ? (
               <img src={activeBot.avatarUrl} alt={activeBot.name} className="w-full h-full object-cover" />
             ) : (
               renderIcon(activeBot.icon)
             )}
           </div>
           <div>
             <h2 className="font-bold text-white leading-tight flex items-center gap-2">
               {activeBot.name}
               <Icons.ChevronDown size={14} className="text-slate-500" />
             </h2>
             <div className="flex items-center gap-2">
               <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                 {activeBot.model.split('-')[1] || 'AI'}
               </span>
             </div>
           </div>
        </button>
        <div className="flex items-center gap-2">
          {showSearch && (
            <div className="relative animate-in slide-in-from-right-4 duration-200">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-1.5 w-32 md:w-48 focus:ring-1 focus:ring-blue-500 outline-none"
                autoFocus
              />
              <button 
                onClick={() => { setSearchTerm(''); setShowSearch(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-900 hover:text-white'}`}
            title="Buscar"
          >
            <Icons.Search size={18} />
          </button>

          <button 
            onClick={handleExportMarkdown}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
            title="Exportar como Markdown"
          >
            <Icons.Download size={18} />
          </button>

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
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <div 
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar"
        onScroll={handleScroll}
        ref={chatContainerRef}
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className={`w-24 h-24 rounded-3xl mb-8 flex items-center justify-center text-white shadow-2xl ${activeBot.avatarColor} ${!searchTerm && 'animate-pulse'}`}>
              {renderIcon(activeBot.icon, 48)}
            </div>
            <h3 className="text-4xl font-black text-white mb-3 tracking-tight">
              {searchTerm ? "No hay resultados" : "Forge Premium"}
            </h3>
            <p className="text-slate-400 max-w-md text-lg leading-relaxed">
              {searchTerm ? `No se encontraron coincidencias para "${searchTerm}"` : activeBot.description}
            </p>
{/* ... truncated if needed but I'll try to provide enough to match ... */}
            {!searchTerm && (
              <div className="mt-8 flex gap-3 flex-wrap justify-center">
                <span className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-xs font-medium flex items-center gap-2">
                  <Camera size={12} /> Análisis de Imágenes
                </span>
                <span className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-xs font-medium flex items-center gap-2">
                  <BrainCircuit size={12} /> Razonamiento Avanzado
                </span>
              </div>
            )}
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
                
                <div className={`rounded-2xl px-5 py-3.5 leading-relaxed shadow-sm relative group/msg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-200'}`}>
                  {/* Actions bar */}
                  <div className={`absolute top-2 flex gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity ${msg.role === 'user' ? '-left-20' : '-right-24'}`}>
                    <button 
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
                      title="Copiar mensaje"
                    >
                      {copiedId === msg.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                    {msg.role === 'model' && !msg.isImage && (
                      <button 
                        onClick={() => handlePlayVoice(msg)}
                        className={`p-1.5 rounded-lg bg-slate-800 border border-slate-700 transition-all ${playingAudioId === msg.id ? 'text-blue-400 animate-pulse' : 'text-slate-400 hover:text-white'}`}
                        title="Escuchar mensaje"
                      >
                        {loadingAudioId === msg.id ? <Loader2 size={14} className="animate-spin" /> : playingAudioId === msg.id ? <Volume2 size={14} /> : <PlayCircle size={14} />}
                      </button>
                    )}
                    <button 
                      onClick={() => onDeleteMessage(msg.id)}
                      className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400"
                      title="Eliminar mensaje"
                    >
                      <Trash2 size={14} />
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
                   <>
                     <motion.div 
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-white/20"
                     />
                     <Zap className="text-white relative z-10" size={20} fill="currentColor" />
                   </>
                 ) : (
                   <BrainCircuit className="text-white animate-pulse" size={20} />
                 )}
               </div>
               
               <div className={`rounded-2xl px-5 py-3 text-sm flex items-center gap-3 shadow-xl ${
                 activeBot.model === ModelType.PRO 
                   ? 'bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/30 text-indigo-100' 
                   : 'bg-slate-900 border border-slate-800 text-slate-400'
               }`}>
                 {activeBot.model === ModelType.PRO ? (
                   <div className="flex items-center gap-4">
                     <div className="flex gap-1.5">
                       {[0, 1, 2].map((i) => (
                         <motion.span
                           key={i}
                           animate={{ 
                             scale: [1, 1.5, 1],
                             opacity: [0.3, 1, 0.3],
                             backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#6366f1'][i] 
                           }}
                           transition={{ 
                             repeat: Infinity, 
                             duration: 1.5, 
                             delay: i * 0.2 
                           }}
                           className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                         />
                       ))}
                     </div>
                     <div className="flex flex-col">
                       <span className="font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                         {activeBot.name} (Gemini 3 Pro)
                       </span>
                       <span className="text-[10px] text-indigo-300/60 font-mono uppercase tracking-widest">
                         Procesando razonamiento profundo...
                       </span>
                     </div>
                   </div>
                 ) : (
                   <>
                     <Loader2 className="animate-spin text-blue-500" size={14} />
                     <span>{activeBot.name} está analizando tu petición...</span>
                   </>
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

      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-4">
          {showCamera && (
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-video animate-in zoom-in-95 duration-300 shadow-2xl border border-slate-800 group">
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

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Camera Header Info */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live: {facingMode === 'user' ? 'Front' : 'Back'} Camera
              </div>

              <div className="absolute inset-x-0 bottom-8 flex justify-center items-center gap-6">
                <button 
                  onClick={stopCamera}
                  className="w-14 h-14 rounded-full bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-white shadow-2xl hover:bg-slate-800 active:scale-90 transition-all border border-white/10"
                  title="Cerrar"
                >
                  <X size={24} />
                </button>

                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-2xl hover:scale-110 active:scale-95 transition-all border-[6px] border-white/30 group/shutter"
                  title="Tomar Foto"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-slate-900/10 flex items-center justify-center group-hover/shutter:bg-slate-50 transition-colors">
                    <Camera size={32} strokeWidth={2.5} />
                  </div>
                </button>

                <button 
                  onClick={toggleCamera}
                  className="w-14 h-14 rounded-full bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-white shadow-2xl hover:bg-slate-800 active:scale-90 transition-all border border-white/10"
                  title="Girar Cámara"
                >
                  <Icons.RefreshCw size={24} />
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl flex items-end p-2 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all shadow-2xl shadow-black/50">
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

            <button 
              onClick={() => startCamera()}
              className={`p-2.5 transition-all rounded-xl h-11 w-11 flex items-center justify-center shrink-0 ${showCamera ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
              title="Cámara"
            >
              <Camera size={20} />
            </button>

            <button 
              onClick={toggleListening}
              className={`p-2.5 transition-colors rounded-xl h-11 w-11 flex items-center justify-center shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
              title={isListening ? "Detener dictado" : "Dictar mensaje"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <div className="flex-1 flex flex-col">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={attachedImage ? "¿Qué quieres saber de esta imagen?" : `Mensaje a ${activeBot.name}...`}
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-600 resize-none py-2.5 px-3 min-h-[44px] max-h-[150px]"
                rows={1}
              />
              
              <AnimatePresence>
                {attachedImage && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-4 px-3 py-3 border-t border-slate-800/50 mt-1">
                      <div className="relative group shrink-0">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-blue-500/50 shadow-lg shadow-blue-500/10 bg-slate-950">
                          <img src={attachedImage.preview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <button 
                          onClick={() => setAttachedImage(null)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors border border-slate-900 z-10"
                          title="Eliminar imagen"
                        >
                          <X size={10} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest inline-flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                          Imagen Lista
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {attachedImage.mimeType.split('/')[1].toUpperCase()} • {(attachedImage.data.length * 0.75 / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleEnhance}
              disabled={!input.trim() || isEnhancing || isStreaming}
              className={`p-2.5 transition-all rounded-xl h-11 w-11 flex items-center justify-center shrink-0 relative group/enhance ${
                isEnhancing 
                  ? 'bg-purple-600 text-white animate-pulse' 
                  : (activeBot.id === 'bot-artist' || activeBot.id === 'bot-video') && input.trim()
                    ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                    : 'text-slate-500 hover:text-purple-400 hover:bg-slate-800'
              }`}
              title="Optimizar prompt con IA"
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
              className={`p-2.5 rounded-xl transition-all transform active:scale-90 ${ (input.trim() || attachedImage) && !isStreaming ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-600'}`}
            >
              <Send size={20} />
            </button>
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
