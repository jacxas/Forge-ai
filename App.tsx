
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { BotCreator } from './components/BotCreator';
import { MediaGallery } from './components/MediaGallery';
import { VideoStudio } from './components/VideoStudio';
import { DEFAULT_BOTS } from './constants';
import { Bot, ChatSession, Message, BotFormData, ModelType, UserProfile } from './types';
import { streamResponse, generateImage } from './services/geminiService';
import { Menu, LogIn, LogOut, Settings } from 'lucide-react';
import { auth, db, signInWithGoogle, completeGoogleRedirectSignIn, getAuthErrorMessage, handleFirestoreError, OperationType } from './lib/firebase';
import { compressImage } from './lib/imageUtils';
import { SettingsModal } from './components/SettingsModal';
import { AdminDashboard } from './components/AdminDashboard';
import { 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  getDocs,
  where
} from 'firebase/firestore';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'chat' | 'gallery' | 'video'>('chat');
  const [bots, setBots] = useState<Bot[]>(DEFAULT_BOTS);
  const [activeBotId, setActiveBotId] = useState<string>(DEFAULT_BOTS[0].id);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCreatorOpen, setCreatorOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isAdminPanelOpen, setAdminPanelOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Monitor Auth State
  useEffect(() => {
    completeGoogleRedirectSignIn().catch((error) => {
      console.error("Error completing Google redirect sign in:", error);
      setAuthError(getAuthErrorMessage(error));
      setLoading(false);
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Profile
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        setProfile({
          ...data,
          isAdmin: data.isAdmin || (user.email ? ['jacxas@gmail.com', 'jacxas@gmai.com'].includes(user.email) : false)
        });
      } else {
        // If profile doesn't exist, we might still want to know if they are admin
        setProfile({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: Date.now(),
          isAdmin: user.email ? ['jacxas@gmail.com', 'jacxas@gmai.com'].includes(user.email) : false
        });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Bots
  useEffect(() => {
    if (!user) {
      setBots(DEFAULT_BOTS);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'bots'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customBots = snapshot.docs.map(doc => doc.data() as Bot);
      setBots([...DEFAULT_BOTS, ...customBots]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/bots`));

    return () => unsubscribe();
  }, [user]);

  // Sync Active Session Messages
  useEffect(() => {
    if (!user || !activeBotId) {
      setActiveMessages([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'sessions', activeBotId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as Message);
      setActiveMessages(msgs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/sessions/${activeBotId}/messages`));

    return () => unsubscribe();
  }, [user, activeBotId]);

  const activeBot = bots.find(b => b.id === activeBotId) || bots[0];

  const handleBotSelect = (botId: string) => {
    setActiveBotId(botId);
    setActiveView('chat');
  };

  const handleCreateBot = async (data: BotFormData) => {
    if (!user) return;

    try {
      if (editingBot) {
        const botRef = doc(db, 'users', user.uid, 'bots', editingBot.id);
        const updateData = { ...data };
        if (updateData.useSearch === undefined) updateData.useSearch = false;
        await setDoc(botRef, { ...editingBot, ...updateData }, { merge: true });
        setEditingBot(null);
      } else {
        const id = `bot-${generateId()}`;
        const newBot: Bot = {
          id,
          ...data,
          useSearch: data.useSearch || false,
          avatarColor: data.avatarColor || 'bg-indigo-500',
          icon: data.icon || 'Bot',
          isDefault: false,
          ownerId: user.uid,
          createdAt: Date.now()
        };
        
        await setDoc(doc(db, 'users', user.uid, 'bots', id), newBot);
        setActiveBotId(id);
      }
      setCreatorOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/bots`);
    }
  };

  const handleEditBot = (bot: Bot) => {
    setEditingBot(bot);
    setCreatorOpen(true);
  };

  const handleDuplicateBot = async (bot: Bot) => {
    if (!user) return;
    try {
      const id = `bot-${generateId()}`;
      const newBot: Bot = {
        ...bot,
        id,
        name: `${bot.name} (Copia)`,
        isDefault: false,
        ownerId: user.uid,
        createdAt: Date.now()
      };
      await setDoc(doc(db, 'users', user.uid, 'bots', id), newBot);
      setActiveBotId(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/bots`);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!user) return;
    if (bots.find(b => b.id === botId)?.isDefault) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'bots', botId));
      if (activeBotId === botId) {
        setActiveBotId(bots[0].id);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/bots/${botId}`);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    try {
      const msgsRef = collection(db, 'users', user.uid, 'sessions', activeBotId, 'messages');
      const snapshot = await getDocs(msgsRef);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/sessions/${activeBotId}/messages`);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'sessions', activeBotId, 'messages', messageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/sessions/${activeBotId}/messages/${messageId}`);
    }
  };

  const saveMessage = async (msg: Message) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'sessions', activeBotId, 'messages', msg.id), msg);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/sessions/${activeBotId}/messages/${msg.id}`);
    }
  };

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSendMessage = async (text: string, image?: { data: string; mimeType: string }) => {
    if (!user) {
      await handleSignIn();
      return;
    }

    let processedImage = image;
    if (image) {
      try {
        const compressedData = await compressImage(image.data);
        processedImage = { ...image, data: compressedData.split(',')[1] }; // Remove prefix
      } catch (err) {
        console.error("Error compressing image:", err);
      }
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text || (processedImage ? "Analiza esta imagen." : ""),
      timestamp: Date.now(),
      botId: activeBotId,
      ...(processedImage ? { attachedImage: processedImage } : {})
    };

    await saveMessage(userMessage);
    await processModelResponse(activeBotId, text, processedImage, [...activeMessages, userMessage]);
  };

  const handleRegenerate = async () => {
    if (activeMessages.length < 2 || !user) return;
    
    const lastUserMsgIndex = [...activeMessages].reverse().findIndex(m => m.role === 'user');
    if (lastUserMsgIndex === -1) return;
    
    const realIndex = activeMessages.length - 1 - lastUserMsgIndex;
    const lastUserMsg = activeMessages[realIndex];
    
    // Delete all messages after and including the last assistant response
    const toDelete = activeMessages.slice(realIndex + 1);
    await Promise.all(toDelete.map(m => deleteDoc(doc(db, 'users', user.uid, 'sessions', activeBotId, 'messages', m.id))));
    
    const historyBefore = activeMessages.slice(0, realIndex + 1);
    await processModelResponse(activeBotId, lastUserMsg.content, lastUserMsg.attachedImage, historyBefore);
  };

  const processModelResponse = async (
    botId: string, 
    text: string, 
    image: { data: string; mimeType: string } | undefined,
    currentHistory: Message[]
  ) => {
    if (!user) return;
    setIsStreaming(true);
    const bot = bots.find(b => b.id === botId) || bots[0];

    try {
      if (bot.model === ModelType.IMAGE) {
        let imageUrl = await generateImage(text);
        
        // Ensure generated image isn't too large for Firestore
        try {
          imageUrl = await compressImage(imageUrl, 1024, 0.8);
        } catch (err) {
          console.error("Error compressing generated image:", err);
        }

        const imageMessage: Message = {
          id: generateId(),
          role: 'model',
          content: `Imagen generada para: "${text}"`,
          isImage: true,
          imageUrl: imageUrl,
          timestamp: Date.now(),
          botId: botId
        };
        await saveMessage(imageMessage);
      } else {
        const modelMessageId = generateId();
        let streamingContent = '';
        
        const historyContext = currentHistory.slice(0, -1).slice(-8); 

        await streamResponse(
          bot.model,
          bot.systemInstruction,
          historyContext,
          text,
          bot.useSearch || false,
          image || null,
          (chunk) => {
            streamingContent += chunk;
            // Local update for UI immediate feel if needed, but Firestore sync is usually fast enough.
            // For better UX during streaming, we might want a local temporary state.
            setActiveMessages(prev => {
              const newMsgs = [...prev];
              const idx = newMsgs.findIndex(m => m.id === modelMessageId);
              if (idx > -1) {
                newMsgs[idx] = { ...newMsgs[idx], content: streamingContent };
              } else {
                newMsgs.push({
                  id: modelMessageId,
                  role: 'model',
                  content: streamingContent,
                  timestamp: Date.now(),
                  botId: botId
                });
              }
              return newMsgs;
            });
          },
          async (groundingChunks) => {
            // No action needed here for immediate UI, but can be saved later
          }
        );

        // Final save to Firestore
        let thumbnail: string | undefined = undefined;
        if (botId === 'bot-video') {
          try {
            const visualPrompt = `Cinematic absolute high quality video frame, hyperrealistic, 4k, film grain, movie still: ${streamingContent.substring(0, 300)}`;
            const rawImage = await generateImage(visualPrompt);
            thumbnail = await compressImage(rawImage, 1024, 0.7);
          } catch (err) {
            console.error("Error generating video thumbnail:", err);
          }
        }

        await saveMessage({
          id: modelMessageId,
          role: 'model',
          content: streamingContent,
          timestamp: Date.now(),
          botId: botId,
          imageUrl: thumbnail
        });
      }
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: generateId(),
        role: 'model',
        content: 'Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
        timestamp: Date.now(),
        botId: botId
      };
      await saveMessage(errorMsg);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin text-blue-500">
          <Menu size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-slate-100 selection:bg-blue-500/30 font-sans">
      {!user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-3xl px-4">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] mx-auto mb-8 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 rotate-3 transition-transform hover:rotate-0">
              <LogOut size={48} className="rotate-180" />
            </div>
            <h2 className="text-3xl font-black mb-3 tracking-tight text-white font-display">FORGE AI</h2>
            <p className="text-slate-400 mb-10 leading-relaxed">Esculpe ideas. Transforma realidades. <br />Desbloquea el poder de la creación ilimitada.</p>
            
            {authError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                {authError}
              </div>
            )}

            <button 
              onClick={handleSignIn}
              disabled={isSigningIn}
              className={`w-full bg-white text-black font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-xs ${isSigningIn ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:bg-slate-200 active:scale-95 shadow-xl hover:shadow-white/10'}`}
            >
              {isSigningIn ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              {isSigningIn ? 'Iniciando sesión...' : 'Continuar con Google'}
            </button>
          </div>
        </div>
      )}

      <div className="md:hidden fixed top-6 left-6 z-40">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="glass p-3 rounded-2xl text-slate-200 shadow-2xl"
        >
          <Menu size={24} />
        </button>
      </div>

      <Sidebar 
        bots={bots} 
        activeBotId={activeBotId} 
        onSelectBot={handleBotSelect}
        onOpenCreator={() => {
          setEditingBot(null);
          setCreatorOpen(true);
        }}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        onEditBot={handleEditBot}
        onDeleteBot={handleDeleteBot}
        onDuplicateBot={handleDuplicateBot}
        user={user}
        userProfile={profile}
        onLogout={() => signOut(auth)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAdmin={() => setAdminPanelOpen(true)}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {activeView === 'chat' ? (
          <ChatArea 
            activeBot={activeBot}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            onClearHistory={handleClearHistory}
            onRegenerate={handleRegenerate}
            onDeleteMessage={handleDeleteMessage}
          />
        ) : activeView === 'gallery' ? (
          <MediaGallery userId={user?.uid || ''} />
        ) : (
          <VideoStudio />
        )}
      </main>

      {isCreatorOpen && (
        <BotCreator 
          onClose={() => {
            setCreatorOpen(false);
            setEditingBot(null);
          }}
          onCreate={handleCreateBot}
          bot={editingBot || undefined}
        />
      )}

      <SettingsModal 
        user={profile}
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUpdateProfile={handleUpdateProfile}
      />
      {isAdminPanelOpen && (
        <AdminDashboard 
          onClose={() => setAdminPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
