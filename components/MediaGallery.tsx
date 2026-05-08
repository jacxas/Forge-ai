import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Message } from '../types';
import { Image as ImageIcon, Video, Download, ExternalLink, Calendar, Search, Filter } from 'lucide-react';
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
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
              <span className="p-2 bg-purple-600 rounded-2xl shadow-lg shadow-purple-600/20">
                <ImageIcon size={28} />
              </span>
              Biblioteca de Medios
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Toda tu creatividad generada por IA en un solo lugar.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
            {(['all', 'image', 'video'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  filter === f 
                    ? 'bg-slate-800 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'image' ? 'Imágenes' : 'Videos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-slate-900 animate-pulse rounded-3xl border border-slate-800" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-6 border border-slate-800">
                <Search size={40} className="text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No se encontró contenido</h3>
              <p className="text-slate-500 max-w-xs">Genera algunas imágenes o conceptos de video para verlos aparecer aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.id}
                    className="group relative aspect-square rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer hover:border-slate-600 transition-all shadow-xl"
                  >
                    <img 
                      src={item.imageUrl || (item.attachedImage ? `data:image/jpeg;base64,${item.attachedImage.data}` : '')} 
                      alt="Media" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onClick={() => setSelectedImage(item.imageUrl || `data:image/jpeg;base64,${item.attachedImage?.data}`)}
                    />
                    
                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter backdrop-blur-md border border-white/20 flex items-center gap-1.5 ${
                        item.botId === 'bot-video' ? 'bg-rose-500/80 text-white' : 'bg-blue-500/80 text-white'
                      }`}>
                        {item.botId === 'bot-video' ? <Video size={10} /> : <ImageIcon size={10} />}
                        {item.botId === 'bot-video' ? 'Video' : 'Imagen'}
                      </div>
                    </div>

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                       <p className="text-[10px] text-white/60 mb-2 font-mono flex items-center gap-1">
                         <Calendar size={10} />
                         {new Date(item.timestamp).toLocaleDateString()}
                       </p>
                       <div className="flex gap-2">
                         <a 
                          href={item.imageUrl || (item.attachedImage ? `data:image/jpeg;base64,${item.attachedImage.data}` : '')}
                          download={`ai-forge-${item.id}.jpg`}
                          className="flex-1 bg-white text-black py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                         >
                           <Download size={12} />
                           Guardar
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
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
            Cerrar
          </button>
          <img 
            src={selectedImage} 
            alt="Full view" 
            className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10" 
          />
        </div>
      )}
    </div>
  );
};
