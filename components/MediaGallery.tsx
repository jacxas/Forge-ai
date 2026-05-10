import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Message } from '../types';
import { Image as ImageIcon, Video, Download, ExternalLink, Calendar, Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MediaGalleryProps {
  userId: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ userId }) => {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, [userId]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      // Fetch all sessions for the user
      const sessionsPath = `users/${userId}/sessions`;
      const sessionsSnap = await getDocs(collection(db, sessionsPath));
      
      const allMedia: Message[] = [];
      
      // For each session, get messages with image data
      // Note: We're doing this sequentially to avoid complex collectionGroup indexes for now
      for (const sessionDoc of sessionsSnap.docs) {
        const messagesPath = `users/${userId}/sessions/${sessionDoc.id}/messages`;
        const messagesSnap = await getDocs(query(
          collection(db, messagesPath),
          orderBy('timestamp', 'desc'),
          limit(50)
        ));
        
        messagesSnap.docs.forEach(doc => {
          const msg = doc.data() as Message;
          if (msg.imageUrl || msg.attachedImage) {
            allMedia.push(msg);
          }
        });
      }

      // Sort by newest
      allMedia.sort((a, b) => b.timestamp - a.timestamp);
      setItems(allMedia);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      handleFirestoreError(error, OperationType.LIST, 'gallery');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'video') return item.botId === 'bot-video';
    if (filter === 'image') return item.botId === 'bot-artist' || item.attachedImage;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-transparent overflow-hidden">
      {/* Header */}
      <div className="p-10 border-b border-white/5 glass backdrop-blur-3xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div>
            <h1 className="text-6xl font-black text-white tracking-tighter flex items-center gap-6 font-display">
              <span className="p-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[2rem] shadow-[0_20px_50px_rgba(147,51,234,0.3)]">
                <ImageIcon size={36} />
              </span>
              NÚCLEO VISUAL
            </h1>
            <p className="text-slate-400 mt-4 text-xl font-light leading-relaxed max-w-xl">
              Visualiza lo imposible con un solo comando. Esculpe tu propio universo visual y desbloquea el catálogo de realidades generadas por tu inteligencia.
            </p>
          </div>

          <div className="flex items-center gap-3 glass-light p-2 rounded-[2rem] border border-white/5">
            {(['all', 'image', 'video'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  filter === f 
                    ? 'bg-white text-black shadow-2xl scale-105' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {f === 'all' ? 'TODO' : f === 'image' ? 'ESTÁTICO' : 'CINÉTICO'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 md:p-14 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square glass-light animate-pulse rounded-[3rem] border border-white/5" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in zoom-in-95 duration-1000">
              <div className="w-32 h-32 rounded-[2.5rem] glass flex items-center justify-center mb-10 border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                <Search size={48} className="text-slate-700" />
              </div>
              <h3 className="text-4xl font-black text-white mb-4 font-display tracking-tight uppercase">EL VACÍO</h3>
              <p className="text-slate-500 max-w-md text-xl leading-relaxed font-light">
                Aún no has materializado conceptos en este plano de existencia.
              </p>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] -z-10"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id}
                    className="group relative aspect-square rounded-[3rem] glass border border-white/5 overflow-hidden cursor-pointer hover:border-white/20 transition-all shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
                  >
                    <img 
                      src={item.imageUrl || (item.attachedImage ? `data:image/jpeg;base64,${item.attachedImage.data}` : '')} 
                      alt="Media" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                      onClick={() => setSelectedImage(item.imageUrl || `data:image/jpeg;base64,${item.attachedImage?.data}`)}
                    />
                    
                    {/* Badge */}
                    <div className="absolute top-6 left-6 z-10 transition-transform group-hover:scale-110">
                      <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-2xl border border-white/20 flex items-center gap-2.5 shadow-2xl ${
                        item.botId === 'bot-video' ? 'bg-rose-500/80 text-white' : 'bg-blue-600/80 text-white'
                      }`}>
                        {item.botId === 'bot-video' ? <Video size={10} /> : <ImageIcon size={10} />}
                        {item.botId === 'bot-video' ? 'VIDEO' : 'IMAGE'}
                      </div>
                    </div>

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8 translate-y-4 group-hover:translate-y-0 text-left">
                       <p className="text-[10px] text-white/40 mb-3 font-mono font-bold tracking-widest flex items-center gap-3">
                         <Calendar size={12} className="text-white/20" />
                         {new Date(item.timestamp).toLocaleDateString().toUpperCase()}
                       </p>
                       <div className="flex gap-3">
                         <a 
                          href={item.imageUrl || (item.attachedImage ? `data:image/jpeg;base64,${item.attachedImage.data}` : '')}
                          download={`forge-entity-${item.id}.jpg`}
                          className="flex-1 bg-white text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95 shadow-2xl"
                          onClick={(e) => e.stopPropagation()}
                         >
                           <Download size={16} />
                           DESCARGAR
                         </a>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 md:p-14 animate-in fade-in duration-500"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-all font-black uppercase text-[10px] tracking-[0.3em] flex items-center gap-3">
             <div className="w-10 h-10 rounded-full glass flex items-center justify-center border border-white/10 group-hover:rotate-90 transition-transform">
               <X size={20} />
             </div>
             CERRAR VISUAL
          </button>
          <img 
            src={selectedImage} 
            alt="Full view" 
            className="max-w-full max-h-full rounded-[3rem] shadow-[0_50px_150px_rgba(0,0,0,0.8)] border border-white/10 animate-in zoom-in-95 duration-500" 
          />
        </div>
      )}
    </div>
  );
};
